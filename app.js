const I18N={"en":{},"de":{}};
let lang=localStorage.getItem('lang')||'en';
const t=k=>I18N[lang][k]||k;
function applyLang(){document.documentElement.lang=lang;document.querySelectorAll('[data-i]').forEach(el=>el.textContent=t(el.dataset.i));document.querySelectorAll('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.lang===lang));}
document.querySelectorAll('.lang button').forEach(b=>b.onclick=()=>{lang=b.dataset.lang;localStorage.setItem('lang',lang);applyLang();});

const VUE_I18N={"en":{"title":"expense splitter","people":"people","expense":"add expense","desc":"description","amount":"amount","paidBy":"paid by","split":"split among","add":"add expense","balances":"balances","settle":"settle up","suggested":"suggested transfers","transactions":"transactions","person":"person","empty":"no expenses yet","local":"saved locally in your browser","del":"remove"},"de":{"title":"kosten-splitter","people":"personen","expense":"ausgabe hinzufügen","desc":"beschreibung","amount":"betrag","paidBy":"bezahlt von","split":"teilen unter","add":"ausgabe hinzufügen","balances":"salden","settle":"abrechnen","suggested":"vorgeschlagene überweisungen","transactions":"buchungen","person":"person","empty":"noch keine ausgaben","local":"wird lokal im browser gespeichert","del":"löschen"}};
const store={
  template:`<div class="sp">
  <section class="card"><h2>{{t('people')}}</h2>
    <div class="chips"><span v-for="p in people" :key="p" class="chip" :class="{on:draft.split.includes(p)}" @click="toggleSplit(p)">{{p}}</span><span class="chip" @click="addPerson">+ {{t('person')}}</span></div>
    <h2>{{t('expense')}}</h2>
    <input v-model="draft.desc" :placeholder="t('desc')">
    <input v-model="draft.amount" type="number" step="0.01" min="0" :placeholder="t('amount')">
    <select v-model="draft.paidBy"><option v-for="p in people" :key="p" :value="p">{{p}}</option></select>
    <button @click="addExpense">{{t('add')}}</button>
  </section>
  <section>
    <div class="card"><h2>{{t('balances')}}</h2>
      <table><tr><th>{{t('person')}}</th><th>{{t('settle')}}</th></tr>
      <tr v-for="(v,p) in balances" :key="p"><td>{{p}}</td><td :class="v>=0?'pos':'neg'">{{money(v)}}</td></tr></table>
    </div>
    <div class="card"><h2>{{t('suggested')}}</h2>
      <table><tr><th>{{t('transactions')}}</th><th></th><th></th></tr>
      <tr v-for="(s,i) in settlements" :key="i"><td>{{s.from}}</td><td>→</td><td>{{s.to}} · {{fmt(s.amount)}}</td></tr>
      <tr v-if="!settlements.length"><td colspan="3" style="color:var(--dim)">{{t('empty')}}</td></tr></table>
    </div>
    <div class="card"><h2>{{t('transactions')}}</h2>
      <table><tr><th>{{t('desc')}}</th><th>{{t('amount')}}</th><th>{{t('paidBy')}}</th><th></th></tr>
      <tr v-for="(e,i) in expenses" :key="i"><td>{{e.desc}}</td><td>{{fmt(e.amount)}}</td><td>{{e.paidBy}}</td><td><button class="ghost" @click="del(i)">{{t('del')}}</button></td></tr>
      <tr v-if="!expenses.length"><td colspan="4" style="color:var(--dim)">{{t('empty')}} — {{t('local')}}</td></tr></table>
    </div>
  </section>
</div>`,
  data(){return{lang:localStorage.getItem('lang')||'en',people:['alex','sam','max'],expenses:[],draft:{desc:'',amount:'',paidBy:'alex',split:['alex','sam','max']}};},
  computed:{
    t(){const lang=this.lang;return k=>VUE_I18N[lang][k]||k;},
    balances(){const bal={};for(const p of this.people)bal[p]=0;
      for(const e of this.expenses){const share=e.amount/e.split.length;bal[e.paidBy]+=e.amount;for(const s of e.split)bal[s]-=share;}
      return bal;},
    settlements(){const bal={...this.balances};const res=[];
      while(true){const debtors=Object.entries(bal).filter(([p,v])=>v<-0.005).sort((a,b)=>a[1]-b[1]);
        const creditors=Object.entries(bal).filter(([p,v])=>v>0.005).sort((a,b)=>b[1]-a[1]);
        if(!debtors.length||!creditors.length)break;
        const [dp,dv]=debtors[0],[cp,cv]=creditors[0];const amt=Math.min(-dv,cv);
        res.push({from:dp,to:cp,amount:Math.round(amt*100)/100});bal[dp]+=amt;bal[cp]-=amt;}
      return res;}
  },
  methods:{
    addPerson(){const n=prompt(this.t('person'));if(n&&n.trim()&&!this.people.includes(n.trim().toLowerCase())){this.people.push(n.trim().toLowerCase());this.draft.split.push(n.trim().toLowerCase());this.save();}},
    toggleSplit(p){const i=this.draft.split.indexOf(p);if(i>=0)this.draft.split.splice(i,1);else this.draft.split.push(p);},
    addExpense(){const amt=parseFloat(this.draft.amount);if(!amt||!this.draft.desc.trim()||!this.draft.split.length)return;
      this.expenses.push({desc:this.draft.desc.trim(),amount:amt,paidBy:this.draft.paidBy,split:[...this.draft.split]});
      this.draft.desc='';this.draft.amount='';this.save();},
    del(i){this.expenses.splice(i,1);this.save();},
    money(v){return (v<0?'−':'+')+' €'+Math.abs(v).toFixed(2);},
    fmt(v){return '€'+v.toFixed(2);},
    save(){localStorage.setItem('sp-'+this.lang,JSON.stringify({people:this.people,expenses:this.expenses}));},
    load(){try{const d=JSON.parse(localStorage.getItem('sp-'+this.lang));if(d){this.people=d.people||this.people;this.expenses=d.expenses||[];}}catch(e){}}
  },
  mounted(){this.load();},
  watch:{lang(){this.load();this.save();}}
};
Vue.createApp(store).mount('#app');
document.querySelectorAll('.lang button').forEach(b=>b.onclick=()=>{localStorage.setItem('lang',b.dataset.lang);location.reload();});