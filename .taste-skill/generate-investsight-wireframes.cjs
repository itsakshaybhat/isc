const fs = require('node:fs');
const path = require('node:path');

const screens = [
  // Public and sign-in
  ['welcome','Public','Welcome / platform','Research with purpose. Invest with clarity.','Request access|request-access','Login|login','How it works|how-it-works','Platform features|features'],
  ['how-it-works','Public','How it works','A clear path from research to review.','Explore strategies|strategies','Request access|request-access'],
  ['features','Public','Platform features','Research, plans and account controls in one workspace.','Explore the platform|login','Contact|contact'],
  ['about','Public','About INVESTSIGHT CAPITAL','Research-led decisions with clear boundaries.','Contact|contact','Request access|request-access'],
  ['login','Public','Sign in','Open the workspace assigned to your account.','Sign in|home','Forgot password|recovery','Request access|request-access'],
  ['register','Public','Create client account','Request a client workspace and select research interests.','Submit access request|access/status','Already have an account|login'],
  ['recovery','Public','Recover account','Continue with your registered account.','Back to Login|login'],
  ['legal','Public','Legal and risk information','Read the product terms, privacy and research risks.','Privacy|legal/privacy','Terms|legal/terms','Risk information|legal/risk'],
  ['public-help','Public','Help centre','Find answers about access, research and account settings.','Contact support|contact','Sign in|login'],
  ['contact','Public','Contact','Send a product or access enquiry.','Send enquiry|contact','Help|public-help'],
  ['education','Public','Investor education','Learn how to read research, risk and model context.','Open learning|learn','Risk information|legal/risk'],
  ['request-access','Public','Request workspace access','Provide your account details and requested strategies.','Submit request|access/status','Sign in|login'],
  ['access/status','Public','Access request status','Check whether your request is pending or approved.','Return to Login|login','Help|public-help'],
  ['session-expired','Public','Session ended','Sign in again to open your assigned workspace.','Back to Login|login'],
  ['access-denied','Public','Access denied','This destination requires administrator access.','Return to workspace|home','Sign in|login'],
  // Client workspace
  ['onboarding','Client','Workspace setup','Choose strategies, theme and notification preferences.','Save setup|home','Broker account|connect-broker'],
  ['connect-broker','Client','Connect broker account','Choose a provider and review account permissions.','Save permissions & open dashboard|home','Read-only mode|home'],
  ['home','Client','Dashboard','Strategy overview, account position and research to review.','Explore stocks|explore','Execution|plan/selections','Portfolio|portfolio','View model results|results','Automation|modal:automation'],
  ['explore','Client','Explore stocks','Ranked companies, strategy filters and review timeline.','Company research|company/:id/overview','Add to Execution|plan/selections','Watch company|watchlist','Compare|compare'],
  ['company/overview','Client','Company research · Overview','Price, model rationale, conditions and fundamentals.','Price chart|company/:id/overview','Financials|company/:id/financials','Technical analysis|company/:id/technical','Events|company/:id/events','Add to Execution|plan/selections','Add alert|modal:alert'],
  ['company/financials','Client','Company research · Financials','Financial history, key ratios and reporting context.','Overview|company/:id/overview','Understand ratios|modal:definitions'],
  ['company/technical','Client','Company research · Technicals','Price structure, volume and selected indicators.','Apply indicators|modal:indicators','Company overview|company/:id/overview'],
  ['company/events','Client','Company research · Events','Company events and their strategy implications.','Analyze event|event/:id','Company overview|company/:id/overview'],
  ['event/:id','Client','Event analysis','What happened, evidence, thesis impact and opposing risk.','Review stock details|company/:id/overview','Add to comparison|compare'],
  ['compare','Client','Company comparison','Compare selected companies on strategy-specific measures.','Choose companies|modal:comparison','Company research|company/:id/overview','Return to Explore|explore'],
  ['plan/selections','Client','Execution · Selections','Choose companies for individual strategy review.','Review conditions|plan/conditions','Remove selection|plan/selections'],
  ['plan/conditions','Client','Execution · Conditions','Check current conditions for each selected company.','Review budget|plan/budget','Back to selections|plan/selections'],
  ['plan/budget','Client','Execution · Allocation','Set a strategy budget and review proposed allocation.','Review plan|plan/review','Edit selections|plan/selections'],
  ['plan/agreement','Client','Execution · Strategy agreement','Review strategy rules, scope and entry permissions.','Accept agreement|plan/monitoring','Read strategy rules|strategy/:key'],
  ['plan/review','Client','Execution · Final review','Review selected stocks, conditions, budget and account scope.','Confirm review|plan/monitoring','Back to budget|plan/budget'],
  ['plan/monitoring','Client','Execution · Monitoring','See the status of selected research and entry checks.','Review pending orders|orders/open','Review positions|portfolio','Review agreement|plan/agreement'],
  ['portfolio','Client','Portfolio','Holdings, quantities, cost, available cash and profit/loss.','Position detail|holding/:id','Rebalance|rebalance','Performance|performance'],
  ['holding/:id','Client','Position detail','Company value, position rationale and risk controls.','Full stock research|company/:id/overview','Risk details|risk/details','Portfolio|portfolio'],
  ['rebalance','Client','Rebalance review','Review proposed changes against allocation and risk checks.','Review portfolio|portfolio','Open execution plan|plan/selections'],
  ['orders','Client','Orders · All','Order status, requested quantity and fills.','Open orders|orders/open','Completed orders|orders/completed','Order detail|order/:id','Export CSV|download:orders'],
  ['orders/open','Client','Orders · Open','Pending and partially filled orders.','Order detail|order/:id','Cancel remaining quantity|modal:cancel-order'],
  ['orders/completed','Client','Orders · Completed','Filled orders and final execution details.','Order detail|order/:id','Export CSV|download:orders'],
  ['order/:id','Client','Order detail','Requested, filled and remaining quantities with provenance.','Cancel remaining quantity|modal:cancel-order','Company research|company/:id/overview'],
  ['risk','Client','Risk & alerts · Overview','Account and strategy exposure, conditions and alert summary.','Details|risk/details','Exposure analysis|risk/analysis','Review position|holding/:id'],
  ['risk/details','Client','Risk & alerts · Details','Individual conditions, severity and follow-up actions.','Open position|holding/:id','Review orders|orders/open'],
  ['risk/analysis','Client','Risk · Exposure analysis','Position weights, return contribution and drawdown.','Risk details|risk/details','Portfolio|portfolio'],
  ['watchlist','Client','Watchlist','Saved companies with price and research signals.','Company research|company/:id/overview','Add companies|modal:watch-picker','Explore stocks|explore'],
  ['news','Client','News & events','Search events and filter to saved companies or holdings.','Event analysis|event/:id','Company research|company/:id/overview','Reset filters|action:clear-news'],
  ['performance','Client','Performance','Equity trend, returns and strategy-level performance context.','Portfolio|portfolio','Generate report|reports'],
  ['reports','Client','Reports','Generate a portfolio, performance or order report.','Generate report|modal:generate-report','Open report|report/:id'],
  ['report/:id','Client','Report detail','Report summary, data timestamp, metrics and charts.','Download PDF|download:pdf','Download CSV|download:csv','Print / Save as PDF|print'],
  ['broker','Client','Broker & capital · Connection','Account connection and combined capital summary.','Change broker|connect-broker','Strategy capital|broker/capital','Manage agreement|plan/agreement'],
  ['broker/capital','Client','Broker & capital · Strategy allocations','Review Long-term, Swing and Intraday capital budgets.','Edit strategy budget|plan/budget','Account connection|broker'],
  ['strategies','Client','Strategies','Compare Long-term, Swing and Intraday approaches.','Open strategy dashboard|home','Read strategy rules|strategy/:key'],
  ['strategy/:key','Client','Strategy rules','Selection, entry, exit and review boundaries.','Open strategy dashboard|home','Explore stocks|explore','Review agreement|plan/agreement'],
  ['recommendations','Client','Recommendations','Published research, revision and tracking status.','Recommendation detail|recommendation/:id','Company research|company/:id/overview'],
  ['recommendation/:id','Client','Recommendation detail','Published rationale, evidence, conditions and revision history.','Company research|company/:id/overview','Add to comparison|compare','Track decision|activity'],
  ['results','Client','Model results','Ranked companies with weighted evidence, score distribution and review history.','Focus company|company/:id/overview','Export model scores|download:model','Explore stocks|explore'],
  ['activity','Client','Activity history','Research, account and order actions with timestamps.','Recommendation detail|recommendation/:id','Order detail|order/:id'],
  ['learn','Client','Learning centre','Learning modules and assessment progress.','Open module|article/:id','Assessments|assessment'],
  ['article/:id','Client','Learning module','Lesson content, progress and assessment readiness.','Continue lesson|article/:id','Take assessment|assessment'],
  ['settings/profile','Client','Settings · Profile','Display name and timezone preferences.','Save changes|action:profile','Workspace settings|settings/workspace'],
  ['settings/connections','Client','Settings · Connections & permissions','Review broker account data and optional execution access.','Review broker|broker','Update permissions|connect-broker'],
  ['settings/workspace','Client','Settings · Workspace & appearance','Theme, navigation layout and display preferences.','Light theme|theme:light','Dark theme|theme:dark','Pure dark|theme:pure-dark','Reset display|action:reset-display'],
  ['settings/security','Client','Settings · Security','Account access, sign-in and session controls.','Review permissions|settings/connections','Sign out|action:signout'],
  ['notifications','Client','Notifications','Research changes, order attention and account notices.','Mark all read|action:mark-read','Open related item|recommendations'],
  ['support','Client','Support','Describe a workspace or account issue.','Submit support request|modal:support','Help centre|public-help'],
  ['search','Client','Search results','Matching companies, tools and workspace pages.','Open result|company/:id/overview','Explore stocks|explore'],
  ['sitemap','Client','Workspace map','All client destinations and route groups.','Dashboard|home','Admin overview|admin'],
  ['automation-paused','Client','Automation controls · Paused state','Red paused status; new entries are stopped. Existing orders and positions need separate review.','Resume new entries|action:toggle-pause','Review pending orders|orders/open','Review positions|portfolio','Review agreement|plan/agreement'],
  // Administrator workspace
  ['admin','Admin','Admin overview','Access queue, research review and operational readiness.','Review users|admin/users','Review research|admin/recommendations','Data health|admin/health','Audit history|admin/audit'],
  ['admin/users','Admin','Users & access','Review identity, account status, role and requested strategies.','Approve or suspend|modal:admin-user-review','Audit history|admin/audit'],
  ['admin/strategies/long','Admin','Strategy configuration · Long-term','Policy inputs, weights, limits, entry and exit rules, version history.','Save policy version|action:admin-strategy','Swing policy|admin/strategies/swing','Intraday policy|admin/strategies/intraday'],
  ['admin/strategies/swing','Admin','Strategy configuration · Swing','Policy inputs, weights, limits, entry and exit rules, version history.','Save policy version|action:admin-strategy','Long-term policy|admin/strategies/long','Intraday policy|admin/strategies/intraday'],
  ['admin/strategies/intraday','Admin','Strategy configuration · Intraday','Policy inputs, weights, limits, entry and exit rules, version history.','Save policy version|action:admin-strategy','Long-term policy|admin/strategies/long','Swing policy|admin/strategies/swing'],
  ['admin/recommendations','Admin','Recommendation review','Pending drafts, rationale, evidence and publication history.','Review recommendation|modal:admin-rec-review','Audit history|admin/audit'],
  ['admin/health','Admin','Data health','Provider connection, dataset freshness, missing values and diagnostics.','Refresh status|action:admin-refresh-health','Download diagnostics|download:diagnostics','Background jobs|admin/jobs'],
  ['admin/jobs','Admin','Background jobs','Scheduled tasks, worker status, failures and retry availability.','Review task|modal:admin-job-review','Data health|admin/health'],
  ['admin/audit','Admin','Audit history','Actor, action, affected area, timestamp and outcome.','Export audit CSV|download:audit','Users & access|admin/users'],
  ['admin/screens','Admin','Screen map & permission contracts','Client/admin routes, permissions, UI states and delivery scope.','Open client screen|home','Admin overview|admin'],
  ['admin/settings','Admin','Admin settings','Administrator identity, session and access boundary.','End session|action:admin-expire-session','Access denied state|access-denied','Screen map|admin/screens']
];

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const W=1280,H=760,GAP_X=90,GAP_Y=86,COLS=5,START_Y=1160;
const totalW=COLS*W+(COLS-1)*GAP_X,totalRows=Math.ceil(screens.length/COLS),totalH=START_Y+totalRows*H+(totalRows-1)*GAP_Y+100;
let out=[`<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">`,
`<rect width="100%" height="100%" fill="#F0F0F0"/>`,
`<style>text{font-family:Arial,sans-serif;fill:#171717}.tiny{font-size:12px}.small{font-size:14px}.body{font-size:16px}.title{font-size:23px;font-weight:700}.section{font-size:20px;font-weight:700}.route{font-size:13px;fill:#626262}.stroke{stroke:#333;stroke-width:2;fill:#fff}.light{fill:#f1f1f1;stroke:#7d7d7d;stroke-width:1.3}.line{stroke:#777;stroke-width:2;fill:none}.arrow{stroke:#4b4b4b;stroke-width:2;fill:none;marker-end:url(#arrow)}</style>`,
`<defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#4b4b4b"/></marker></defs>`];
const rect=(x,y,w,h,rx=0,cls='stroke')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${cls}"/>`;
const text=(x,y,s,cls='body',anchor='start')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(s)}</text>`;

// Opening map: clear client and admin wires, with buttons named at each transition.
out.push(rect(30,30,totalW-60,1040,12,'stroke'));
out.push(text(64,82,'INVESTSIGHT CAPITAL · PAGE & BUTTON FLOW MAP','title'));
out.push(text(64,116,'Low-fidelity wireframes · Client research workspace + administrator workspace · Button captions show the route or action.','small'));
out.push(text(64,168,'CLIENT ENTRY & RESEARCH','section'));
const flowClient=[['Welcome','/welcome'],['Sign in','/login'],['Broker setup','/connect-broker'],['Dashboard','/home'],['Explore','/explore'],['Company research','/company/:id/overview'],['Execution plan','/plan/selections'],['Conditions','/plan/conditions'],['Budget','/plan/budget'],['Agreement','/plan/agreement'],['Monitoring','/plan/monitoring'],['Orders','/orders']];
const fx=72,fy=205,bw=278,bh=86,fg=44;
flowClient.forEach((n,i)=>{const x=fx+i*(bw+fg);out.push(rect(x,fy,bw,bh,8,'light'));out.push(text(x+14,fy+31,n[0],'small'));out.push(text(x+14,fy+59,n[1],'route'));if(i<flowClient.length-1)out.push(`<path d="M${x+bw} ${fy+bh/2} H${x+bw+fg-10}" class="arrow"/>`);});
out.push(text(64,358,'SECONDARY CLIENT ROUTES','section'));
const flowRows=[
 [['Portfolio','/portfolio'],['Position','/holding/:id'],['Risk detail','/risk/details'],['Rebalance','/rebalance'],['Performance','/performance']],
 [['News & events','/news'],['Event analysis','/event/:id'],['Company research','/company/:id/overview'],['Recommendations','/recommendations'],['Model results','/results']],
 [['Settings','/settings/profile'],['Appearance','/settings/workspace'],['Connections','/settings/connections'],['Notifications','/notifications'],['Reports','/reports']]
];
flowRows.forEach((row,r)=>row.forEach((n,i)=>{const x=fx+i*(bw+fg),y=385+r*104;out.push(rect(x,y,bw,82,8,'light'));out.push(text(x+12,y+30,n[0],'small'));out.push(text(x+12,y+56,n[1],'route'));}));
const flowLinks=[
 [0,0,'Request access'],[0,1,'Login'],[1,2,'Client sign in'],[2,3,'Save permissions'],[3,4,'Explore stocks'],[4,5,'Company research'],[5,6,'Add to Execution'],[6,7,'Review conditions'],[7,8,'Review budget'],[8,9,'Review agreement'],[9,10,'Accept agreement'],[10,11,'Review orders'],
];
flowLinks.forEach(([a,b,label])=>{const ax=fx+a*(bw+fg)+bw/2, bx=fx+b*(bw+fg)+bw/2; const yy=fy+bh+5; if(b>a+1)return; out.push(text(ax+8,yy+14,label,'tiny'));});

const adminY=770;out.push(text(64,adminY-28,'ADMIN ENTRY & REVIEW','section'));
const flowAdmin=[['Sign in','/login'],['Admin overview','/admin'],['Users & access','/admin/users'],['Strategy policy','/admin/strategies/:key'],['Research review','/admin/recommendations'],['Data health','/admin/health'],['Background jobs','/admin/jobs'],['Audit history','/admin/audit']];
flowAdmin.forEach((n,i)=>{const x=fx+i*(bw+fg),y=adminY;out.push(rect(x,y,bw,82,8,'light'));out.push(text(x+12,y+30,n[0],'small'));out.push(text(x+12,y+56,n[1],'route'));if(i<flowAdmin.length-1)out.push(`<path d="M${x+bw} ${y+41} H${x+bw+fg-10}" class="arrow"/>`);});
out.push(text(64,adminY+112,'Administrator access is selected at sign-in by account role. Client and administrator navigation stay separate.','small'));

function addPanel(x,y,w,h,titleText,items=[],kind='list'){
  out.push(rect(x,y,w,h,7,'light'));out.push(text(x+16,y+29,titleText,'small'));
  if(kind==='chart'){
    const gx=x+24,gy=y+54,gw=w-50,gh=h-78;out.push(`<path d="M${gx} ${gy} V${gy+gh} H${gx+gw}" class="line"/>`);
    for(let i=0;i<4;i++){const bx=gx+38+i*(gw-70)/4,bh=20+((i*29+17)%Math.max(32,gh-24));out.push(`<rect x="${bx}" y="${gy+gh-bh}" width="26" height="${bh}" fill="#b7b7b7" stroke="#666"/>`);}
    out.push(text(x+16,y+h-10,'Axis labels · period · scale','tiny'));
  }else if(kind==='table'){
    const rowH=29;out.push(rect(x+12,y+47,w-24,rowH,0,'light'));out.push(text(x+22,y+67,items[0]||'Company · Status · Score','tiny'));
    for(let i=1;i<Math.min(items.length,5);i++){out.push(rect(x+12,y+47+i*rowH,w-24,rowH,0,'stroke'));out.push(text(x+22,y+67+i*rowH,items[i],'tiny'));}
  }else{
    items.slice(0,5).forEach((v,i)=>{const yy=y+55+i*31;out.push(rect(x+14,yy,w-28,25,3,'stroke'));out.push(text(x+24,yy+17,v,'tiny'));});
  }
}
function addButton(x,y,label,target){out.push(rect(x,y,176,34,5,'stroke'));out.push(text(x+9,y+22,label,'tiny'));out.push(text(x+184,y+22,'→ '+target,'route'));}
screens.forEach((s,i)=>{
  const x=30+(i%COLS)*(W+GAP_X),y=START_Y+Math.floor(i/COLS)*(H+GAP_Y);
  out.push(`<g id="screen-${esc(s[0].replace(/[^a-z0-9]+/gi,'-'))}">`);
  out.push(rect(x,y,W,H,10,'stroke'));
  const isPublic=s[1]==='Public',isAdmin=s[1]==='Admin';
  if(isPublic){
    out.push(rect(x,y,W,54,0,'light'));out.push(text(x+22,y+34,'INVESTSIGHT CAPITAL','small'));
    out.push(text(x+470,y+34,'Platform     How it works     About     Contact','tiny'));
    out.push(text(x+22,y+112,'PUBLIC WORKSPACE · '+s[0].toUpperCase(),'route'));
    out.push(text(x+22,y+160,s[2],'title'));out.push(text(x+22,y+188,s[3],'small'));
    addPanel(x+22,y+226,584,185,'Main content & form fields',['Account / page details','Research-only account context','Validation and help text']);
    addPanel(x+626,y+226,632,185,'Supporting information',['Terms · privacy · risk notice','Progress, status or contact details']);
    addPanel(x+22,y+430,1236,114,'Page content / status',['Instructions and field descriptions','Inline validation or confirmation'], 'list');
    let ax=x+22,ay=y+574;for(const v of s.slice(4)){const [lab,target]=v.split('|');addButton(ax,ay,lab,target);ay+=45;}
  }else{
    out.push(rect(x,y,W,56,0,'light'));out.push(text(x+17,y+34,'INVESTSIGHT CAPITAL','small'));
    out.push(text(x+238,y+34,'Long-term   Swing   Intraday','tiny'));
    out.push(text(x+505,y+34,'⌕ Search','tiny'));out.push(text(x+670,y+34,'Research-only','tiny'));out.push(text(x+810,y+34,'Broker account','tiny'));
    out.push(rect(x+948,y+15,116,27,5,isAdmin?'stroke':'light'));out.push(text(x+958,y+34,'Automation','tiny'));
    if(s[0]==='automation-paused'){out.push(rect(x+1068,y+15,99,27,5,'stroke'));out.push(`<rect x="${x+1068}" y="${y+15}" width="99" height="27" rx="5" fill="#FCE8E8" stroke="#B42318"/>`);out.push(`<text x="${x+1078}" y="${y+34}" font-size="12" fill="#B42318">Paused</text>`);}
    out.push(text(x+1186,y+34,'Theme ▾','tiny','end'));
    out.push(rect(x,y+56,208,H-56,0,'light'));
    out.push(text(x+16,y+85,isAdmin?'ADMINISTRATION':'WORKSPACE','route'));
    const nav=isAdmin?['Overview','Users & access','Strategy configuration','Recommendation review','Data health','Background jobs','Audit history','Screen map','Admin settings']:['Dashboard','Explore stocks','Execution','Portfolio','Orders','Comparison','Risk & alerts','Recommendations','Watchlist','News & events','Performance','Reports','Broker & capital','Model results','Activity history','Learning','Settings'];
    nav.forEach((n,j)=>{const yy=y+103+j*32;if(n===s[2]||n.startsWith(s[2].split(' · ')[0]))out.push(rect(x+9,yy-17,190,26,4,'stroke'));out.push(text(x+20,yy,n,'tiny'));});
    out.push(text(x+236,y+90,(isAdmin?'ADMINISTRATION':'CLIENT WORKSPACE')+'  /  '+s[0].toUpperCase(),'route'));
    out.push(text(x+236,y+132,s[2],'title'));out.push(text(x+236,y+157,s[3],'tiny'));
    const kx=x+236,ky=y+181,kw=246;
    ['Status / scope','Current period','Summary metric','Last updated'].forEach((k,j)=>{out.push(rect(kx+j*(kw+9),ky,kw,67,5,'light'));out.push(text(kx+12+j*(kw+9),ky+23,k,'tiny'));out.push(text(kx+12+j*(kw+9),ky+48,'[ value ]','small'));});
    const c1x=x+236,c2x=x+752,cy=y+266,cw=500;
    addPanel(c1x,cy,cw,194,s[2]+' · overview',['Primary detail / decision context','Current status and supporting evidence','Owner · scope · date']);
    addPanel(c2x,cy,cw,194,s[2]+' · analysis',[],['results','company/overview','performance','admin/health'].includes(s[0])?'chart':'list');
    const tableRows=['Record · description · state · updated','Selected item · scope · status','Historical item · outcome · timestamp'];
    addPanel(c1x,y+475,cw,150,'Records / evidence',tableRows,'table');
    addPanel(c2x,y+475,cw,150,'Review / follow-up',['Filter · sort · search','Primary and secondary evidence','Empty, stale and error states']);
    s.slice(4).forEach((v,j)=>{const [lab,target]=v.split('|');const bx=x+236+(j%3)*336,by=y+646+Math.floor(j/3)*42;addButton(bx,by,lab,target);});
  }
  out.push(text(x+W-16,y+H-14,s[1]+' · '+s[0],'route','end'));
  out.push('</g>');
});
out.push('</svg>');
const outPath=path.join(__dirname,'investsight-capital-wireframes.svg');fs.writeFileSync(outPath,out.join('\n'),'utf8');
console.log(JSON.stringify({outPath,screenCount:screens.length,categoryCounts:screens.reduce((a,s)=>(a[s[1]]=(a[s[1]]||0)+1,a),{}),bytes:fs.statSync(outPath).size,rows:totalRows,canvas:{width:totalW,height:totalH}}));
