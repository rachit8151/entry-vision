const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    roleId: {
        type: Number,
        required: true,
        unique: true
    },
    roleName: {
        type: String,
        required: true
    }
}, { collection: 'tblRoles' });

module.exports = mongoose.models.Role || mongoose.model('Role', RoleSchema);
