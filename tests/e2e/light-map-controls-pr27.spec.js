const { test, expect } = require('@playwright/test');

function rgb(value) {
  const match = String(value || '').match(/rgba?\(([^)]+)\)/);
  return match ? match[1].split(',').slice(0,3).map(Number) : [0,0,0];
}

function luminance([r,g,b]) {
  const p=[r,g,b].map(v=>{
    const x=v/255;
    return x<=0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055,2.4);
  });
  return 0.2126*p[0]+0.7152*p[1]+0.0722*p[2];
}

function contrast(fg,bg) {
  const a=luminance(rgb(fg)), b=luminance(rgb(bg));
  return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
}

test('PR27 mantém controles do mapa claros e legíveis no tema claro', async ({ page }) => {
  await page.setViewportSize({width:1600,height:900});
  await page.goto('/index.html',{waitUntil:'load'});
  await page.addStyleTag({content:`
    #realMapControls *, #realMapControls { transition:none!important; }
  `});
  await page.evaluate(()=>{
    document.documentElement.dataset.theme='light';
    delete document.documentElement.dataset.palette;
  });
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));

  const metrics=await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll(
      '#realMapControls > .real-map-control-group, #realMapControls > .real-map-layer-switches'
    )].filter(n=>n.getBoundingClientRect().width>0);

    const buttons=[...document.querySelectorAll(
      '#realMapControls .real-map-control-group button'
    )].filter(n=>n.getBoundingClientRect().width>0);

    const labels=[...document.querySelectorAll(
      '#realMapControls .real-map-layer-switches label'
    )].filter(n=>n.getBoundingClientRect().width>0);

    const mapNode=n=>{
      const s=getComputedStyle(n);
      return {
        text:(n.textContent||'').trim(),
        bg:s.backgroundColor,
        color:s.color,
        border:s.borderColor
      };
    };

    return {
      theme:document.documentElement.dataset.theme,
      palette:document.documentElement.dataset.palette||'',
      groups:nodes.map(mapNode),
      buttons:buttons.map(mapNode),
      labels:labels.map(mapNode)
    };
  });

  expect(metrics.theme).toBe('light');
  expect(metrics.palette).toBe('');
  expect(metrics.groups.length).toBeGreaterThanOrEqual(2);
  expect(metrics.buttons.length).toBeGreaterThanOrEqual(3);
  expect(metrics.labels.length).toBeGreaterThanOrEqual(3);

  for(const item of [...metrics.groups,...metrics.buttons,...metrics.labels]){
    expect(luminance(rgb(item.bg)), item.text || 'container').toBeGreaterThan(0.72);
    if(item.text){
      expect(contrast(item.color,item.bg), item.text).toBeGreaterThanOrEqual(4.5);
    }
  }
});
