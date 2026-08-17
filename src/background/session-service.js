import { getSession,patchSession } from '../core/db.js';
const TAB_SESSIONS_KEY='tabSessions';
async function getTabMap(){const result=await chrome.storage.session.get(TAB_SESSIONS_KEY);return result[TAB_SESSIONS_KEY]||{};}
async function saveTabMap(map){await chrome.storage.session.set({[TAB_SESSIONS_KEY]:map});}
export function mergeSessionRegistration(existing,session,now=Date.now()){const userNamed=existing?.titleSource==='user';return{...session,title:userNamed?existing.title:session.title,titleSource:userNamed?'user':'page',createdAt:existing?.createdAt||session.createdAt||now,updatedAt:now,lastSeenAt:now,paused:Boolean(existing?.paused),pendingOrigins:existing?.pendingOrigins||[]};}
export async function registerTabSession(tabId,session){if(!Number.isInteger(tabId)||tabId<0)throw new Error('Invalid tab ID');if(!session?.sessionKey)throw new Error('Session key is required');const now=Date.now(),existing=await getSession(session.sessionKey),next=await patchSession(session.sessionKey,mergeSessionRegistration(existing,session,now)),map=await getTabMap();map[String(tabId)]={sessionKey:next.sessionKey,providerId:next.providerId,siteId:next.siteId||'',pageUrl:next.pageUrl||'',registeredAt:now};await saveTabMap(map);return next;}
export async function listTabSessions(){const map=await getTabMap();return Object.entries(map).map(([tabId,value])=>({tabId:Number(tabId),...value})).filter(item=>Number.isInteger(item.tabId));}
export async function getTabSession(tabId){if(!Number.isInteger(tabId)||tabId<0)return null;const map=await getTabMap();return map[String(tabId)]||null;}
export async function removeTabSession(tabId){const map=await getTabMap();delete map[String(tabId)];await saveTabMap(map);}
export async function tabsForSession(sessionKey){const map=await getTabMap();return Object.entries(map).filter(([,value])=>value?.sessionKey===sessionKey).map(([tabId])=>Number(tabId)).filter(Number.isInteger);}
