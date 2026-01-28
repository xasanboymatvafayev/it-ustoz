
import emailjs from '@emailjs/browser';

const SERVICE_ID = 'service_pa8gy9p'; 
const TEMPLATE_ID = 'template_oqf4m5n';
const PUBLIC_KEY = 'WBQT54zVVgzcv_3Nj';

export async function sendVerificationEmail(email: string, code: string, name: string): Promise<boolean> {
  try {
    const templateParams = {
      to_email: email, 
      name: name,
      message: `Tasdiqlash kodingiz: ${code}`, 
      time: new Date().toLocaleString('uz-UZ'),
      title: "Verifikatsiya",
      email: email
    };
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

export async function sendPasswordRecoveryEmail(email: string, username: string, pass: string): Promise<boolean> {
  try {
    const templateParams = {
      to_email: email,
      name: username,
      message: `Sizning login ma'lumotlaringiz:\nLogin: ${username}\nParol: ${pass}`,
      title: "Parolni tiklash",
      time: new Date().toLocaleString('uz-UZ')
    };
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    return true;
  } catch (error) {
    return false;
  }
}
