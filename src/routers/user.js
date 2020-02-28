const express=require('express')
const User=require('../models/user')
const auth=require('../middleware/auth')
const multer=require('multer')
const sharp=require('sharp')
const {sendWelcomeEmail,sendCancelEmail}=require('../emails/accounts')
const router=new express.Router()



//SIGN UP USERS
router.post("/users",async (req, res) => {
    const user = new User(req.body);
  
    try {
      await user.save();
      sendWelcomeEmail(user.email,user.name)
      const token=await user.generateAuthToken()
      res.status(201).send({user,token});
    } catch (e) {
      res.status(400).send(e);
    }
  });

//Login
router.post('/users/login',async(req,res)=>{
    try{
        const user=await User.findByCredentials(req.body.email,req.body.password)
        const token=await user.generateAuthToken()
        res.send({user,token})

    }catch(e){
        res.status(400).send()
    }

})
//Logout
router.post('/users/logout',auth,async (req,res)=>{
    try{
        req.user.tokens=req.user.tokens.filter((token)=>{
            return token.token!== req.token
        })
        await req.user.save()

        res.send()
    }catch(e){
        res.status(500).send()
    }
})

//Logout all
router.post('/users/logoutAll',auth,async (req,res)=>{
    try{
        req.user.tokens=[]
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

  //GET USERS
router.get("/users/me",auth ,async (req, res) => {
    res.send(req.user)
  });
  //UPDATE USER 
router.patch('/users/me',auth,async(req,res)=>{
    const updates=Object.keys(req.body)
    const allowedUpdates=['name','email','password','age']
    const isValidOperation= updates.every((update)=>allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid updates!'})
    }

    try{
        updates.forEach((update)=>req.user[update]=req.body[update])
        await req.user.save()
        res.send(req.user)
    }catch(e){
        res.status(400).send(e)
    }
})
//DELETE USER
router.delete('/users/me',auth,async(req,res)=>{
    
    try{
        
        await req.user.remove()
        sendCancelEmail(req.user.email,req.user.name)
        res.send(req.user)
    }catch(e){
        res.status(500).send()
    }
})

//UPLOAD LIBRARY
const avatars=multer({
    limits:{
        fileSize: 1000000,
    },
        fileFilter(req,file,cb){
            if(!file.originalname.match(/\.(png|jpg|jpeg)$/)){
                return cb(new Error('File must be jpg/png/jpeg'))
            }
            cb(undefined,true)
            // cb(new Error('File must be a PDF'))
            // cb(undefined,true)
            // cb(undefined,false)
        }
})

//UPLOAD PICTURE
router.post('/users/me/avatar',auth,avatars.single('avatar'),async (req,res)=>{
    const buffer=await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    
    // req.user.avatar=req.file.buffer
    req.user.avatar=buffer
    await req.user.save()
    res.send()
},(error,req,res,next)=>{
    res.status(400).send({error:error.message})
})

router.delete('/users/me/avatar',auth,avatars.single('avatar'),async(req,res)=>{
    req.user.avatar=undefined
    await req.user.save()
    res.send()
},(error,req,res,next)=>{
    res.status(404).send({error:error.message})
})

router.get('/users/:id/avatar',async(req,res)=>{
    try{
        const user= await User.findById(req.params.id)

        if(!user ||!user.avatar){
            throw Error()
        }

        res.set('Content-Type','image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(404).send()
    }
})
module.exports=router