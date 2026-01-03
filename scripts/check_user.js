(async ()=>{
  try{
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    const u = await p.user.findUnique({ where: { email: 'test@example.com' } });
    console.log('user:', u);
    await p.$disconnect();
  }catch(e){
    console.error('error', e);
  }
})();