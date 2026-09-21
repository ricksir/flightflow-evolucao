const { test, expect } = require('@playwright/test');

function rgb(value) {
  const match = String(value || '').match(/rgba?\(([^)]+)\)/);
  return match ? match[1].split(',').slice(0,3).map(Number) : [0,0,0];
}
function luminance([r,g,b]) {
  const c=[r,g,b].map(v=>{ const x=v/255; return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4); });
  return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];
}
function contrast(fg,bg) {
  const a=luminance(rgb(fg)), b=luminance(rgb(bg));
  return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
}
async function loadDemo(page) {
  await page.setViewportSize({width:1600,height:900});
  await page.goto('/index.html',{waitUntil:'load'});
  const overlay=page.locator('#overlayDemoBtn');
  if(await overlay.isVisible()) await overlay.click();
  else await page.locator('#demoBtn').click();
  await expect(page.locator('#fieldsGrid .field-card').first()).toBeVisible();
  await expect(page.locator('#playBtn')).toHaveAttribute('title',/Pausar/,{timeout:5000});
  await page.locator('#restartBtn').click();
}

test('PR26 exige dashboard realmente legível em 1600x900', async ({page}) => {
  await loadDemo(page);
  await page.evaluate(()=>{document.documentElement.dataset.theme='light';delete document.documentElement.dataset.palette;});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const m=await page.evaluate(()=>{
    const q=s=>document.querySelector(s), st=s=>getComputedStyle(q(s)), rect=s=>q(s).getBoundingClientRect();
    const normal=q('#fieldsGrid .field-card:not(.changed)')||q('#fieldsGrid .field-card');
    const changed=q('#fieldsGrid .field-card.changed');
    return {
      inspector:rect('.inspector-card').width, workspace:rect('.workspace-card').width,
      heading:parseFloat(st('[data-panel="data"] .panel-heading h2').fontSize),
      label:parseFloat(st('#fieldsGrid .field-label').fontSize),
      value:parseFloat(st('#fieldsGrid .field-value').fontSize),
      tab:parseFloat(st('.inspector-tabs .tab').fontSize),
      time:parseFloat(st('#currentTimeLabel').fontSize),
      normalBg:getComputedStyle(normal).backgroundColor,
      normalValue:getComputedStyle(normal.querySelector('.field-value')).color,
      normalLabel:getComputedStyle(normal.querySelector('.field-label')).color,
      changedBg:changed?getComputedStyle(changed).backgroundColor:'',
      changedShadow:changed?getComputedStyle(changed).boxShadow:'',
      scrollWidth:document.documentElement.scrollWidth, viewportWidth:innerWidth
    };
  });
  expect(m.inspector).toBeGreaterThanOrEqual(410);
  expect(m.workspace).toBeGreaterThan(m.inspector*2);
  expect(m.heading).toBeGreaterThanOrEqual(17);
  expect(m.label).toBeGreaterThanOrEqual(12.5);
  expect(m.value).toBeGreaterThanOrEqual(15);
  expect(m.tab).toBeGreaterThanOrEqual(12.5);
  expect(m.time).toBeGreaterThanOrEqual(11);
  expect(contrast(m.normalValue,m.normalBg)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(m.normalLabel,m.normalBg)).toBeGreaterThanOrEqual(4.5);
  if(m.changedBg){expect(m.changedBg).toBe(m.normalBg);expect(m.changedShadow).not.toBe('none');}
  expect(m.scrollWidth).toBeLessThanOrEqual(m.viewportWidth+1);
});

for(const mode of [{theme:'dark',palette:''},{theme:'dark',palette:'velox'}]){
  test('PR26 mantém leitura forte em '+(mode.palette||mode.theme),async({page})=>{
    await loadDemo(page);
    await page.addStyleTag({content:`
      .tab-panel[data-panel="data"] .fields-grid .field-card,
      .tab-panel[data-panel="data"] .fields-grid .field-card:hover {
        transition: none !important;
      }
    `});
    await page.evaluate(mode=>{document.documentElement.dataset.theme=mode.theme;if(mode.palette)document.documentElement.dataset.palette=mode.palette;else delete document.documentElement.dataset.palette;},mode);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    await expect.poll(()=>page.evaluate(()=>({
      theme:document.documentElement.dataset.theme||'',
      palette:document.documentElement.dataset.palette||''
    }))).toEqual({theme:mode.theme,palette:mode.palette});
    const m=await page.evaluate(()=>{
      const card=document.querySelector('#fieldsGrid .field-card'), value=card.querySelector('.field-value'), label=card.querySelector('.field-label');
      return {bg:getComputedStyle(card).backgroundColor,value:getComputedStyle(value).color,label:getComputedStyle(label).color,valueSize:parseFloat(getComputedStyle(value).fontSize),labelSize:parseFloat(getComputedStyle(label).fontSize)};
    });
    expect(m.valueSize).toBeGreaterThanOrEqual(15);
    expect(m.labelSize).toBeGreaterThanOrEqual(12.5);
    expect(contrast(m.value,m.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(m.label,m.bg)).toBeGreaterThanOrEqual(4.5);
  });
}
