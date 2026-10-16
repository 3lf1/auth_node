import mongoose from 'mongoose';
import argon2 from 'argon2';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        trim: true
    }
})

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next();
    }

    try {
        this.password = await argon2.hash(this.password, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost:  3,
            parallelism: 2
        });
        next();
    }catch(err){
        next(err);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword){
    return argon2.verify(this.password, candidatePassword);
};

const User = mongoose.model('User', userSchema);
export default User;
