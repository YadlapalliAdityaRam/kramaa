const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class ContainerPool {
    constructor() {
        this.pool = [];
        this.maxSize = Number.parseInt(process.env.CONTAINER_POOL_SIZE || '3', 10) || 3; // Keep warm containers
        this.imageName = process.env.DOCKER_RUNNER_IMAGE || 'algoverse-runner';
        this.containerPrefix = 'algoverse-worker-';
    }

    async initialize() {
        console.log('[ContainerPool] Initializing warm pool...');
        try {
            // Check if image exists, simple check
            await execPromise(`docker inspect --type=image ${this.imageName}`);
        } catch (e) {
            console.log(`[ContainerPool] Image ${this.imageName} not found. Please build it first.`);
            // In a real scenario, we might trigger a build here
            return;
        }

        // Cleanup old containers
        await this.cleanup();

        // Start warm containers
        const promises = [];
        for (let i = 0; i < this.maxSize; i++) {
            promises.push(this.createContainer(i));
        }
        await Promise.all(promises);
        console.log(`[ContainerPool] Pool initialized with ${this.pool.length} containers.`);
    }

    async createContainer(index) {
        const name = `${this.containerPrefix}${index}-${Date.now()}`;
        try {
            // Start container and keep it alive (sleep infinity)
            // Mount a temp volume if needed, or just ephemeral
            const cmd = `docker run -d --name ${name} --memory="512m" --cpus="0.5" --rm ${this.imageName} sleep infinity`;
            await execPromise(cmd);

            const container = {
                id: name,
                busy: false,
                lastUsed: Date.now()
            };
            this.pool.push(container);
            console.log(`[ContainerPool] Started container: ${name}`);
            return container;
        } catch (error) {
            console.error(`[ContainerPool] Failed to start container ${name}:`, error.message);
        }
    }

    async acquire() {
        // Find a free container
        const freeContainer = this.pool.find(c => !c.busy);
        if (freeContainer) {
            freeContainer.busy = true;
            freeContainer.lastUsed = Date.now();
            return freeContainer;
        }

        // If no free container, maybe create one on demand (scaling)?
        // For now, just wait or error. 
        // Simple scaling: if pool < max * 2, create new?
        // Let's implement simple waiting or return null (queue handled by consumer)
        console.log('[ContainerPool] No free containers, waiting...');

        // Return null to indicate need to wait (caller handles retry/queue)
        return null;
    }

    async release(containerId) {
        const container = this.pool.find(c => c.id === containerId);
        if (container) {
            // Clean up workspace inside container?
            // "Compile Once, Run Many" implies we might keep state? 
            // BUT for security, ideally we clean /tmp/workspace.
            try {
                // Quick cleanup command (optional, depends on driver implementation)
                // await execPromise(`docker exec ${containerId} rm -rf /tmp/workspace/*`);
            } catch (e) { }

            container.busy = false;
        }
    }

    async cleanup() {
        console.log('[ContainerPool] Cleaning up old containers...');
        try {
            // Kill all containers matching our prefix
            // This is a bit aggressive, ensuring we start fresh
            const { stdout } = await execPromise(`docker ps -a --filter "name=${this.containerPrefix}" --format "{{.ID}}"`);
            if (stdout.trim()) {
                const ids = stdout.trim().split('\n').join(' ');
                await execPromise(`docker rm -f ${ids}`);
            }
        } catch (error) {
            // Ignore if none found
        }
        this.pool = [];
    }
}

module.exports = new ContainerPool();
