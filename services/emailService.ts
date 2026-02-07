
// Demo Mode: Email jo'natish simulyatsiya qilinadi
export async function sendVerificationEmail(email: string, code: string, name: string): Promise<boolean> {
  console.log(`[DEMO] Verification email sent to ${email} with code: ${code}`);
  // emailjs.send(...) mantiqi vaqtincha o'chirildi
  return true;
}

export async function sendPasswordRecoveryEmail(email: string, username: string, pass: string): Promise<boolean> {
  console.log(`[DEMO] Password recovery for ${username} to ${email}`);
  return true;
}
