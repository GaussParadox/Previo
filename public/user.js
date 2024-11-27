const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, 
    phone: { type: String, required: true, match: /^\d{10}$/ }, 
    email: { type: String, required: true, unique: true },      // Correo electrónico único
    password: { type: String, required: true },
    registrationDate: { type: Date, default: Date.now } // Fecha de registro
});

// Hashear la contraseña antes de guardarla
UserSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('password')) {
        try {
            this.password = await bcrypt.hash(this.password, saltRounds);
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

// Verificar si la contraseña es correcta
UserSchema.methods.isCorrectPassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (err) {
        throw new Error(err);
    }
}

module.exports = mongoose.model('User', UserSchema);