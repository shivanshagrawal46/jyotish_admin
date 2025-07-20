const mongoose = require('mongoose');
const KoshContent = require('./models/KoshContent');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database');

async function addTestSearchTerms() {
    try {
        // Find the content with id 1 (from your example)
        const content = await KoshContent.findOne({ id: 1 });
        
        if (content) {
            // Add some test search terms
            content.search = "6th house rahu, gochar vichar, ग्रहों का स्थान, planets position";
            await content.save();
            console.log('✅ Updated content with search terms:', content.search);
        } else {
            console.log('❌ Content with id 1 not found');
        }

        // Add search terms to a few more contents for testing
        const contents = await KoshContent.find().limit(5);
        const testTerms = [
            "hello, hi, test1",
            "hello2, hi2, test2", 
            "mangal, mars, red planet",
            "shani, saturn, slow planet",
            "guru, jupiter, wisdom planet"
        ];

        for (let i = 0; i < Math.min(contents.length, testTerms.length); i++) {
            contents[i].search = testTerms[i];
            await contents[i].save();
            console.log(`✅ Updated content ${i + 1} with search terms: ${testTerms[i]}`);
        }

        console.log('\n🎯 Now test the API endpoints:');
        console.log('GET /api/kosh-content/subcategory/{subcategoryId}');
        console.log('GET /api/kosh-content/category/{categoryId}');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

addTestSearchTerms(); 