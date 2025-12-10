/**
 * MongoDB Index Creation Script
 * 
 * This script creates necessary indexes for optimal query performance.
 * Run this ONCE after deploying the optimized code.
 * 
 * Usage: node scripts/createIndexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function createIndexes() {
    console.log('🔧 Starting index creation...\n');
    
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        const db = mongoose.connection.db;
        
        // ============================================
        // KoshContent Collection Indexes
        // ============================================
        console.log('📦 Creating indexes for KoshContent collection...');
        
        const koshContentCollection = db.collection('koshcontents');
        
        // Index 1: subCategory (for filtering)
        try {
            await koshContentCollection.createIndex(
                { subCategory: 1 },
                { name: 'subCategory_1', background: true }
            );
            console.log('   ✅ Created index: subCategory_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index subCategory_1 already exists');
            } else {
                throw e;
            }
        }
        
        // Index 2: Compound index for subCategory + hindiWord (for filtering + sorting)
        try {
            await koshContentCollection.createIndex(
                { subCategory: 1, hindiWord: 1 },
                { name: 'subCategory_hindiWord_1', background: true }
            );
            console.log('   ✅ Created index: subCategory_hindiWord_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index subCategory_hindiWord_1 already exists');
            } else {
                throw e;
            }
        }
        
        // Index 3: id field (for lookups by integer id)
        try {
            await koshContentCollection.createIndex(
                { id: 1 },
                { name: 'id_1', unique: true, background: true }
            );
            console.log('   ✅ Created index: id_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index id_1 already exists');
            } else {
                throw e;
            }
        }
        
        // ============================================
        // KoshCategory Collection Indexes
        // ============================================
        console.log('\n📦 Creating indexes for KoshCategory collection...');
        
        const koshCategoryCollection = db.collection('koshcategories');
        
        // Index: id field
        try {
            await koshCategoryCollection.createIndex(
                { id: 1 },
                { name: 'id_1', unique: true, background: true }
            );
            console.log('   ✅ Created index: id_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index id_1 already exists');
            } else {
                throw e;
            }
        }
        
        // Index: position for sorting
        try {
            await koshCategoryCollection.createIndex(
                { position: 1 },
                { name: 'position_1', background: true }
            );
            console.log('   ✅ Created index: position_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index position_1 already exists');
            } else {
                throw e;
            }
        }
        
        // ============================================
        // KoshSubCategory Collection Indexes
        // ============================================
        console.log('\n📦 Creating indexes for KoshSubCategory collection...');
        
        const koshSubCategoryCollection = db.collection('koshsubcategories');
        
        // Index: id field
        try {
            await koshSubCategoryCollection.createIndex(
                { id: 1 },
                { name: 'id_1', unique: true, background: true }
            );
            console.log('   ✅ Created index: id_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index id_1 already exists');
            } else {
                throw e;
            }
        }
        
        // Index: parentCategory for filtering
        try {
            await koshSubCategoryCollection.createIndex(
                { parentCategory: 1 },
                { name: 'parentCategory_1', background: true }
            );
            console.log('   ✅ Created index: parentCategory_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index parentCategory_1 already exists');
            } else {
                throw e;
            }
        }
        
        // Compound index: parentCategory + id for efficient lookups
        try {
            await koshSubCategoryCollection.createIndex(
                { parentCategory: 1, id: 1 },
                { name: 'parentCategory_id_1', background: true }
            );
            console.log('   ✅ Created index: parentCategory_id_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index parentCategory_id_1 already exists');
            } else {
                throw e;
            }
        }
        
        // ============================================
        // KarmkandContent Collection Indexes
        // ============================================
        console.log('\n📦 Creating indexes for KarmkandContent collection...');
        
        const karmkandContentCollection = db.collection('karmkandcontents');
        
        // Index 1: subCategory (for filtering)
        try {
            await karmkandContentCollection.createIndex(
                { subCategory: 1 },
                { name: 'subCategory_1', background: true }
            );
            console.log('   ✅ Created index: subCategory_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index subCategory_1 already exists');
            } else {
                throw e;
            }
        }
        
        // Index 2: Compound index for subCategory + hindiWord (for filtering + sorting)
        try {
            await karmkandContentCollection.createIndex(
                { subCategory: 1, hindiWord: 1 },
                { name: 'subCategory_hindiWord_1', background: true }
            );
            console.log('   ✅ Created index: subCategory_hindiWord_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index subCategory_hindiWord_1 already exists');
            } else {
                throw e;
            }
        }
        
        // Index 3: id field (for lookups by integer id)
        try {
            await karmkandContentCollection.createIndex(
                { id: 1 },
                { name: 'id_1', unique: true, background: true }
            );
            console.log('   ✅ Created index: id_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index id_1 already exists');
            } else {
                throw e;
            }
        }
        
        // ============================================
        // KarmkandCategory Collection Indexes
        // ============================================
        console.log('\n📦 Creating indexes for KarmkandCategory collection...');
        
        const karmkandCategoryCollection = db.collection('karmkandcategories');
        
        // Index: id field
        try {
            await karmkandCategoryCollection.createIndex(
                { id: 1 },
                { name: 'id_1', unique: true, background: true }
            );
            console.log('   ✅ Created index: id_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index id_1 already exists');
            } else {
                throw e;
            }
        }
        
        // Index: position for sorting
        try {
            await karmkandCategoryCollection.createIndex(
                { position: 1 },
                { name: 'position_1', background: true }
            );
            console.log('   ✅ Created index: position_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index position_1 already exists');
            } else {
                throw e;
            }
        }
        
        // ============================================
        // KarmkandSubCategory Collection Indexes
        // ============================================
        console.log('\n📦 Creating indexes for KarmkandSubCategory collection...');
        
        const karmkandSubCategoryCollection = db.collection('karmkandsubcategories');
        
        // Index: id field
        try {
            await karmkandSubCategoryCollection.createIndex(
                { id: 1 },
                { name: 'id_1', unique: true, background: true }
            );
            console.log('   ✅ Created index: id_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index id_1 already exists');
            } else {
                throw e;
            }
        }
        
        // Index: parentCategory for filtering
        try {
            await karmkandSubCategoryCollection.createIndex(
                { parentCategory: 1 },
                { name: 'parentCategory_1', background: true }
            );
            console.log('   ✅ Created index: parentCategory_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index parentCategory_1 already exists');
            } else {
                throw e;
            }
        }
        
        // Compound index: parentCategory + id for efficient lookups
        try {
            await karmkandSubCategoryCollection.createIndex(
                { parentCategory: 1, id: 1 },
                { name: 'parentCategory_id_1', background: true }
            );
            console.log('   ✅ Created index: parentCategory_id_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index parentCategory_id_1 already exists');
            } else {
                throw e;
            }
        }
        
        // ============================================
        // EMagazine Collection Indexes
        // ============================================
        console.log('\n📦 Creating indexes for EMagazine collection...');
        
        const emagazineCollection = db.collection('emagazines');
        
        // Index: category (for filtering by category)
        try {
            await emagazineCollection.createIndex(
                { category: 1 },
                { name: 'category_1', background: true }
            );
            console.log('   ✅ Created index: category_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index category_1 already exists');
            } else {
                throw e;
            }
        }
        
        // Index: subject (for filtering by subject)
        try {
            await emagazineCollection.createIndex(
                { subject: 1 },
                { name: 'subject_1', background: true }
            );
            console.log('   ✅ Created index: subject_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index subject_1 already exists');
            } else {
                throw e;
            }
        }
        
        // Index: writer (for filtering by writer)
        try {
            await emagazineCollection.createIndex(
                { writer: 1 },
                { name: 'writer_1', background: true }
            );
            console.log('   ✅ Created index: writer_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index writer_1 already exists');
            } else {
                throw e;
            }
        }
        
        // Index: createdAt descending (for sorting in /all endpoint)
        try {
            await emagazineCollection.createIndex(
                { createdAt: -1 },
                { name: 'createdAt_-1', background: true }
            );
            console.log('   ✅ Created index: createdAt_-1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index createdAt_-1 already exists');
            } else {
                throw e;
            }
        }
        
        // Index: id field
        try {
            await emagazineCollection.createIndex(
                { id: 1 },
                { name: 'id_1', unique: true, background: true }
            );
            console.log('   ✅ Created index: id_1');
        } catch (e) {
            if (e.code === 85) {
                console.log('   ⚠️  Index id_1 already exists');
            } else {
                throw e;
            }
        }
        
        // ============================================
        // Verify Indexes
        // ============================================
        console.log('\n📊 Verifying indexes...\n');
        
        const contentIndexes = await koshContentCollection.indexes();
        console.log('KoshContent indexes:', contentIndexes.map(i => i.name).join(', '));
        
        const categoryIndexes = await koshCategoryCollection.indexes();
        console.log('KoshCategory indexes:', categoryIndexes.map(i => i.name).join(', '));
        
        const subCategoryIndexes = await koshSubCategoryCollection.indexes();
        console.log('KoshSubCategory indexes:', subCategoryIndexes.map(i => i.name).join(', '));
        
        const karmkandContentIndexes = await karmkandContentCollection.indexes();
        console.log('KarmkandContent indexes:', karmkandContentIndexes.map(i => i.name).join(', '));
        
        const karmkandCategoryIndexes = await karmkandCategoryCollection.indexes();
        console.log('KarmkandCategory indexes:', karmkandCategoryIndexes.map(i => i.name).join(', '));
        
        const karmkandSubCategoryIndexes = await karmkandSubCategoryCollection.indexes();
        console.log('KarmkandSubCategory indexes:', karmkandSubCategoryIndexes.map(i => i.name).join(', '));
        
        const emagazineIndexes = await emagazineCollection.indexes();
        console.log('EMagazine indexes:', emagazineIndexes.map(i => i.name).join(', '));
        
        console.log('\n✅ All indexes created successfully!');
        console.log('\n🚀 Your API should now be significantly faster!\n');
        
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createIndexes();

