const nodemailer = require("nodemailer");
const debug = require("debug")("strava-app:email");

module.exports = { sendMail };
let transporter;

async function setup() {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 465,
        secure: true,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    debug("Email connected");
}
setup().catch(console.error);

async function sendMail(to, subject, text, html) {
    let info = await transporter.sendMail({
        from: '"5K App" <alerts@bjm.me.uk>',
        to: to,
        subject: subject,
        text: text,
        html: html,
    });
    debug("message sent: ", info.messageId);
}
