/* Загрузка ленты новостей и простая логика поиска/детальной страницы */
(function(){
  const byId = (id)=>document.getElementById(id);
  const fmt = (iso)=>{
    try{ return new Date(iso).toLocaleDateString('ru-RU', {year:'numeric',month:'long',day:'numeric'}); }
    catch{ return iso }
  };
  const escapeHtml = (s='') => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const simpleMd = (s='') => (
    s
      .replace(/^### (.*)$/gm,'<h3>$1</h3>')
      .replace(/^## (.*)$/gm,'<h2>$1</h2>')
      .replace(/^# (.*)$/gm,'<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.*?)\*/g,'<em>$1</em>')
      .replace(/`([^`]+)`/g,'<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n\n/g,'</p><p>')
  );

  const isPostPage = location.pathname.endsWith('post.html');

  if (!isPostPage) {
    // INDEX PAGE
    const list = byId('news-list');
    const search = byId('search');
    const noRes = byId('no-results');
    fetch('data/news.json?_=' + Date.now()).then(r=>r.json()).then(items=>{
      const render = (arr)=>{
        list.innerHTML = '';
        if(!arr.length){ noRes.style.display='block'; return; }
        noRes.style.display='none';
        for(const it of arr){
          const a = document.createElement('a');
          a.className='card';
          a.href = 'post.html?id='+encodeURIComponent(it.id);
          a.innerHTML = `
            ${it.cover ? `<img src="${escapeHtml(it.cover)}" alt="">` : ''}
            <h3>${escapeHtml(it.title)}</h3>
            <div class="meta">${fmt(it.date)}${it.tags?.length ? ' · ' + it.tags.map(escapeHtml).join(', ') : ''}</div>
            <p>${escapeHtml(it.summary)}</p>
            <span>Читать →</span>`;
          list.appendChild(a);
        }
      };
      // Sort by date desc initially
      items.sort((a,b)=> (b.date || '').localeCompare(a.date || ''));
      render(items);
      search?.addEventListener('input', e=>{
        const q = (e.target.value || '').toLowerCase().trim();
        const filtered = items.filter(it => 
          it.title.toLowerCase().includes(q) ||
          it.summary.toLowerCase().includes(q) ||
          (it.content || '').toLowerCase().includes(q) ||
          (it.tags || []).join(' ').toLowerCase().includes(q)
        );
        render(filtered);
      });
    });

    // How-to modal
    const link = document.getElementById('howto-link');
    const modal = document.getElementById('howto');
    const closeBtn = document.getElementById('howto-close');
    link?.addEventListener('click', (e)=>{ e.preventDefault(); modal.hidden = false; });
    closeBtn?.addEventListener('click', ()=> modal.hidden = true);
  } else {
    // POST PAGE
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    fetch('data/news.json?_=' + Date.now()).then(r=>r.json()).then(items=>{
      const it = items.find(x=> String(x.id) === String(id));
      const title = document.getElementById('title');
      const date = document.getElementById('date');
      const tags = document.getElementById('tags');
      const content = document.getElementById('content');
      const cover = document.getElementById('cover');
      if(!it){
        title.textContent = 'Новость не найдена';
        return;
      }
      document.getElementById('page-title').textContent = it.title + ' • Лаборатория';
      title.textContent = it.title;
      date.textContent = (it.date ? new Date(it.date).toLocaleDateString('ru-RU', {year:'numeric',month:'long',day:'numeric'}) : '');
      tags.textContent = (it.tags || []).join(', ');
      if (it.cover){ cover.src = it.cover; cover.style.display = ''; }
      // Allow basic HTML and simple markdown -> sanitize very lightly (escape then re-insert links/format)
      const safe = escapeHtml(it.content || '').replace(/\n/g,'\n');
      content.innerHTML = '<p>' + simpleMd(safe) + '</p>';
    });
  }

  // Footer year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();