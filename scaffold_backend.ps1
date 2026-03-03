# Helper function to create file if it doesn't exist
function Create-File {
    param (
        [string]$Path
    )
    $Dir = Split-Path -Path $Path -Parent
    if (-not (Test-Path -Path $Dir)) {
        New-Item -ItemType Directory -Force -Path $Dir | Out-Null
    }
    if (-not (Test-Path -Path $Path)) {
        New-Item -ItemType File -Force -Path $Path | Out-Null
        Write-Host "Created: $Path"
    }
    else {
        Write-Host "Exists: $Path"
    }
}

# Backend Structure (Relative to AlgoVerse root)
$backendFiles = @(
    "backend/config/database.js", "backend/config/redis.js", "backend/config/socket.js", "backend/config/passport.js", "backend/config/constants.js",
    "backend/models/User.js", "backend/models/Algorithm.js", "backend/models/Problem.js", "backend/models/Submission.js", "backend/models/Company.js", "backend/models/ChatMessage.js", "backend/models/UserProgress.js", "backend/models/Playlist.js", "backend/models/AnimationState.js", "backend/models/TestCase.js",
    "backend/middleware/auth.js", "backend/middleware/errorHandler.js", "backend/middleware/validation.js", "backend/middleware/rateLimiter.js", "backend/middleware/logger.js",
    "backend/controllers/authController.js", "backend/controllers/algorithmController.js", "backend/controllers/animationController.js", "backend/controllers/problemController.js", "backend/controllers/submissionController.js", "backend/controllers/companyController.js", "backend/controllers/chatController.js", "backend/controllers/progressController.js", "backend/controllers/visualizationController.js", "backend/controllers/analyticsController.js",
    "backend/routes/authRoutes.js", "backend/routes/algorithmRoutes.js", "backend/routes/animationRoutes.js", "backend/routes/problemRoutes.js", "backend/routes/submissionRoutes.js", "backend/routes/companyRoutes.js", "backend/routes/chatRoutes.js", "backend/routes/progressRoutes.js", "backend/routes/index.js",
    "backend/services/animation/AnimationEngine.js", 
    "backend/services/codeExecution/CodeRunner.js",
    "backend/services/learning/StepExplainer.js",
    "backend/services/company/CompanyAnalyzer.js",
    "backend/utils/generators/stepGenerator.js",
    "backend/server.js"
)

Write-Host "Scaffolding Backend..."
foreach ($file in $backendFiles) { Create-File -Path "$file" }

Write-Host "Scaffolding Complete!"
