const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Company = require('../models/Company'); // Adjust path as needed
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const companies = [
    // Product Based
    { name: 'Google', type: 'Product-Based' },
    { name: 'Microsoft', type: 'Product-Based' },
    { name: 'Amazon', type: 'Product-Based' },
    { name: 'Apple', type: 'Product-Based' },
    { name: 'Meta', type: 'Product-Based' },
    { name: 'Netflix', type: 'Product-Based' },
    { name: 'Adobe', type: 'Product-Based' },
    { name: 'Salesforce', type: 'Product-Based' },
    { name: 'Uber', type: 'Product-Based' },
    { name: 'Airbnb', type: 'Product-Based' },
    { name: 'Twitter', type: 'Product-Based' },
    { name: 'LinkedIn', type: 'Product-Based' },
    { name: 'Atlassian', type: 'Product-Based' },
    { name: 'Dropbox', type: 'Product-Based' },
    { name: 'Spotify', type: 'Product-Based' },
    { name: 'NVIDIA', type: 'Product-Based' },
    { name: 'Intel', type: 'Product-Based' },
    { name: 'Qualcomm', type: 'Product-Based' },
    { name: 'PayPal', type: 'Product-Based' },
    { name: 'Oracle', type: 'Product-Based' },

    // Service Based
    { name: 'TCS', type: 'Service-Based' },
    { name: 'Infosys', type: 'Service-Based' },
    { name: 'Wipro', type: 'Service-Based' },
    { name: 'HCL Technologies', type: 'Service-Based' },
    { name: 'Tech Mahindra', type: 'Service-Based' },
    { name: 'Cognizant', type: 'Service-Based' },
    { name: 'Accenture', type: 'Service-Based' },
    { name: 'Capgemini', type: 'Service-Based' },
    { name: 'IBM', type: 'Service-Based' },
    { name: 'Deloitte', type: 'Service-Based' },
    { name: 'PwC', type: 'Service-Based' },
    { name: 'EY', type: 'Service-Based' },
    { name: 'KPMG', type: 'Service-Based' },
    { name: 'DXC Technology', type: 'Service-Based' },
    { name: 'CGI', type: 'Service-Based' },
    { name: 'NTT Data', type: 'Service-Based' },
    { name: 'Atos', type: 'Service-Based' },
    { name: 'Fujitsu', type: 'Service-Based' },
    { name: 'EPAM Systems', type: 'Service-Based' },
    { name: 'Genpact', type: 'Service-Based' },
    { name: 'LTTS', type: 'Service-Based' },
    { name: 'Mindtree', type: 'Service-Based' },
    { name: 'Mphasis', type: 'Service-Based' },
    { name: 'Persistent Systems', type: 'Service-Based' },
    { name: 'Hexaware Technologies', type: 'Service-Based' },
    { name: 'Birlasoft', type: 'Service-Based' },
    { name: 'Zensar Technologies', type: 'Service-Based' },
    { name: 'Sonata Software', type: 'Service-Based' },
    { name: 'UST', type: 'Service-Based' },
    { name: 'Sutherland Global Services', type: 'Service-Based' }
];

const seedCompanies = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        console.log(`Seeding ${companies.length} companies...`);

        let createdCount = 0;
        let updatedCount = 0;

        for (const company of companies) {
            const existing = await Company.findOne({ name: company.name });
            if (existing) {
                // Update just in case type changed, though unlikely for this task
                existing.type = company.type;
                await existing.save();
                updatedCount++;
            } else {
                await Company.create(company);
                createdCount++;
            }
        }

        console.log(`Seeding Complete! Created: ${createdCount}, Updated: ${updatedCount}`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedCompanies();
