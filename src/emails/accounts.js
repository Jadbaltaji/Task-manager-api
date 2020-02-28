const sgMail=require('@sendgrid/mail')



sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail=(email,name)=>{
    sgMail.send({
        to:email,
        from:'jad@jadb.me',
        subject:'Thanks for joining in!',
        text:`Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendCancelEmail=(email,name)=>{
    sgMail.send({
        to:email,
        from:'jad@jadb.me',
        subject:'Goodbye! Feedback about the app welcome.',
        text:`Thank you for using the app ${name}, please feel free to provide feedback!`
    })
}

module.exports={
    sendWelcomeEmail,
    sendCancelEmail
}