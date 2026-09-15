/** First reward-bearing attempt per game/chapter; shared by spawn and award gates. */
const KEY = 'pennyFever.firstPrizeAttempts.v1';
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}}
export function prizeAttempts(id,level){return Number(read()[id+':'+level])||0;}
export function firstPrizeEligible(id,level){return prizeAttempts(id,level)===1;}
export function recordPrizeAttempt(id,level){
 const book=read(),key=id+':'+level;book[key]=(Number(book[key])||0)+1;
 try{localStorage.setItem(KEY,JSON.stringify(book));}catch{}
 return book[key];
}
