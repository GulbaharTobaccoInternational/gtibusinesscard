export const PRIVATE_HEADERS = { 'Cache-Control':'no-store, private, max-age=0', 'Pragma':'no-cache', 'X-Content-Type-Options':'nosniff' };
export class RequestError extends Error { constructor(public status:number,message:string){super(message);} }
export async function readPrivateJson(request: Request):Promise<unknown>{
  const origin=request.headers.get('origin');
  if(origin && new URL(origin).host!==(request.headers.get('host')??new URL(request.url).host))throw new RequestError(403,'Please use this application to generate cards.');
  if(!request.headers.get('content-type')?.includes('application/json'))throw new RequestError(415,'Send a JSON request.');
  const limit=16_384;
  if(Number(request.headers.get('content-length')??0)>limit)throw new RequestError(413,'The submitted details are too large.');
  const reader=request.body?.getReader();if(!reader)throw new RequestError(400,'Missing request body.');
  let bytes=0;const chunks:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>limit){await reader.cancel();throw new RequestError(413,'The submitted details are too large.');}chunks.push(value);}
  const body=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder().decode(body));}catch{throw new RequestError(400,'The submitted details could not be read.');}
}
