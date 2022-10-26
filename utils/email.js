const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
    constructor(client, topic, email) {
        this.to = email;
        this.firstName = client;
        this.topic = topic;
        this.from = process.env.EMAIL_FROM
    }
    newTransport() {
        if(process.env.NODE_ENV === "production"){
            return nodemailer.createTransport({
                service: "SendGrid",
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
            })
        }
        else {
            return nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
        }
    }
    async send(template, subject) {

        const html = pug.renderFile(`${__dirname}/../emails/${template}.pug`, {
            firstName: this.firstName,
            topic: this.topic,
            subject: subject
        })

        const mailOptions = {
            from: this.from,
            to: this.to,
            subject: subject,
            html,
            text: htmlToText.fromString(html)
        }

        await this.newTransport().sendMail(mailOptions);
    }
    async sendMyself(template, subject, message){
        const html = pug.renderFile(`${__dirname}/../emails/${template}.pug`, {
            firstName: this.firstName,
            topic: this.topic,
            message,
            subject: subject
        })

        const mailOptions = {
            from: this.from,
            to: this.from,
            subject: subject,
            html,
            text: htmlToText.fromString(html)
        }

        await this.newTransport().sendMail(mailOptions);
    }
    async sendWelcome(){
        this.send("welcome", "(Brandon) I received your email");
    }
    async sendToMyself(message){
        this.sendMyself("forMe", `Someone has sent you an email with the topic "${this.topic}"`, message);
    }
}