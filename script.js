// ---- Before / After drag slider ----
(function(){
  const slider = document.getElementById('hero-slider');
  if(!slider) return;
  const clip = slider.querySelector('.ba-clip');
  const handle = slider.querySelector('.ba-handle');
  let dragging = false;

  function setPosition(clientX){
    const rect = slider.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    clip.style.width = pct + '%';
    handle.style.left = pct + '%';
  }

  function start(e){
    dragging = true;
    slider.classList.add('dragging');
  }
  function stop(){
    dragging = false;
    slider.classList.remove('dragging');
  }
  function move(e){
    if(!dragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    setPosition(x);
  }

  slider.addEventListener('mousedown', (e)=>{ start(); setPosition(e.clientX); });
  window.addEventListener('mouseup', stop);
  window.addEventListener('mousemove', move);

  slider.addEventListener('touchstart', (e)=>{ start(); setPosition(e.touches[0].clientX); }, {passive:true});
  window.addEventListener('touchend', stop);
  window.addEventListener('touchmove', move, {passive:true});

  // gentle auto-demo on load: sweep once so people notice it's interactive
  let demoStep = 0;
  const demo = setInterval(()=>{
    demoStep++;
    const pct = 50 + Math.sin(demoStep/6) * 18;
    if(!dragging) { clip.style.width = pct + '%'; handle.style.left = pct + '%'; }
    if(demoStep > 40){ clearInterval(demo); clip.style.width='50%'; handle.style.left='50%'; }
  }, 40);
})();

// ---- Mobile nav toggle ----
(function(){
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if(!toggle || !nav) return;
  toggle.addEventListener('click', ()=>{
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach(link=>{
    link.addEventListener('click', ()=> nav.classList.remove('open'));
  });
})();

// ---- Footer year ----
document.getElementById('year').textContent = new Date().getFullYear();

// ---- Quote form ----
(function(){
  const form = document.getElementById('quote-form');
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get('name') || '';
    const phone = data.get('phone') || '';
    const email = data.get('email') || '';
    const address = data.get('address') || '';
    const service = data.get('service') || '';
    const message = data.get('message') || '';

    const subject = encodeURIComponent(`Free Quote Request — ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nAddress/Area: ${address}\nService: ${service}\n\nDetails:\n${message}`
    );
    window.location.href = `mailto:awngeaux@gmail.com?subject=${subject}&body=${body}`;
  });
})();
