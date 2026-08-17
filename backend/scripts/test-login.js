const fs = require('fs');
(async ()=>{
  try {
    const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@admissionturkey.local', password: 'Admin123!' })
    });

    const status = res.status;
    let body;
    try { body = await res.json(); } catch(e) { body = await res.text(); }

    const out = { status, body };
    fs.writeFileSync(__dirname + '/test-login-result.json', JSON.stringify(out, null, 2));
    console.log('Wrote test-login-result.json');

  } catch (err) {
    fs.writeFileSync(__dirname + '/test-login-result.json', JSON.stringify({ error: err.message }));
    console.error('ERR', err.message);
    process.exit(1);
  }
})();
