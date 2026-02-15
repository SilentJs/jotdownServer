import { Client } from 'cassandra-driver'
import { adminPanelOrderStatus, credentialsJson, order, tokenJson } from './interface';
import { generateTimestamp, superLongUUID } from './utility';

export default class databaseClient{
  constructor(keyspace:string){
    this.keyspace=keyspace
    this.client = new Client({
      contactPoints: ['0.tcp.in.ngrok.io'],
      localDataCenter: 'datacenter1',
      keyspace,
      protocolOptions: {port: 11060}
    });
    const connectToCassandra = async () => {
    try {
      await this.client.connect();
      console.log('Connected to Cassandra');
  
      // Your Cassandra operations here
      // await this.client.execute(`CREATE TABLE IF NOT EXISTS jotdown.writerCredentials(UUID text,username text,password text,PRIMARY KEY(UUID));`).then((r)=>{console.log(r)})     
      // await this.client.execute(`INSERT INTO jotdown.writerCredentials(UUID,username,password) VALUES('${superLongUUID()}','testingshawty','yourchestisflataf') IF NOT EXISTS;`).then((r)=>{console.log(r)})
    } catch (error) {
      console.error('Error connecting to Cassandra:', error);
    }
    //  finally {
    //   await client.shutdown();
    //   console.log('Connection closed')
    // }
    }
    connectToCassandra()
  }

  public async buy(order: order): Promise<'SUCCESS' | 'FAILED'> {
    try {
        let generatedUUID: string = superLongUUID();
        let timeStamp = JSON.stringify(generateTimestamp());
                
        await Promise.all([
            this.createGenericTable({ userid: order.id }),
            this.createGenericTable({ userid: '', uuid: '' })
        ])
        
        order.orderid = generatedUUID;
        order.timestamp = timeStamp;
        await Promise.all([
          this.tableInsert({ userid: order.id, status: 'NF' }, order),
          this.tableInsert({ status: 'NF' }, order)
        ])
        return 'SUCCESS'
        // console.log('About to call tableInsert with order:');
        // const insertResult = await 

        // console.log('insertResult:', insertResult);
        // //@ts-ignore
        // if (insertResult.rows[0]['[applied]']) {
        //     const secondInsertResult = await
        //     //@ts-ignore
        //     if (secondInsertResult.rows[0]['[applied]']) {
        //         return 'SUCCESS';
        //     } else {
        //         throw new Error('Second insert failed');
        //     }
        // } else {
        //     throw new Error('First insert failed');
        // }
    } catch (error) {
        console.error(error);
        return 'FAILED';
    }
}


    public async checkForOrders(id: string): Promise<Object> {
      return new Promise(async (resolve, reject) => {
        await this.client.execute(`
          SELECT * FROM ${this.keyspace}."${id}Orders";
        `).then(
          (r) => { resolve(r.rows); },
          (error) => {
            console.error(error);
            reject({});
          }
        );
      });
    }

    public async randomQuery(input:string){
      await this.client.execute(input).then((r)=>{return r;})
    }
    public async adminCredentialsCheck():Promise<Array<any>>{
      return new Promise(async (resolve,reject)=>{
        await this.client.execute(`
          SELECT * FROM ${this.keyspace}.admincredentials`).then((r)=>{resolve(r.rows);return;},()=>{reject({})})
      })
    }
    public async writerCredentialsCheck():Promise<Array<any>>{
      return new Promise(async (resolve,reject)=>{
        await this.client.execute(`
          SELECT * FROM ${this.keyspace}.writercredentials`).then((r)=>{resolve(r.rows);return;},()=>{reject({})})
      })
    }
    public async writerAssign(orderId:string,uuid:string):Promise<void>{
      return new Promise(async (resolve,reject)=>{
        this.writerCredentialsCheck().then(r=>r.forEach(async (x:credentialsJson)=>{
          if(`${uuid}`===`${x.uuid}`){
            // await this.client.execute(`
            // SELECT * FROM ${this.keyspace}.writercredentials`).then((r)=>{resolve(r.rows);return;},()=>{reject({})})
            await this.createGenericTable({uuid})
            await this.client.execute(`
            SELECT * FROM jotdown.Orders WHERE orderid = '${orderId}' ALLOW FILTERING;
            `).then(async (r:any)=>{
                const order:any=JSON.parse(JSON.stringify(r.rows[0]))
                console.log(order)
                await this.client.execute(`UPDATE orders SET orderstatus='SA',assignedWriterId='${uuid}' WHERE orderId='${order.orderid}' AND id='${order.id}'`)
                await this.client.execute(`UPDATE "${order.id}Orders" SET orderstatus='SA',assignedWriterId='${uuid}' WHERE orderId='${order.orderid}' AND id='${order.id}'`)
                await this.tableInsert({uuid,status:'SA'},order)
                resolve()
              },()=>{reject({})})
          }
        }))
      })
    }
    public async writerDeAssign(orderId:string,uuid:string):Promise<void>{
      return new Promise(async (resolve,reject)=>{
        this.writerCredentialsCheck().then(r=>r.forEach(async (x:any)=>{
          if(uuid===x.uuid){
            

            // await this.client.execute(`
            // SELECT * FROM ${this.keyspace}.writercredentials`).then((r)=>{resolve(r.rows);return;},()=>{reject({})})
            await this.createGenericTable({uuid})
            await this.client.execute(`
            SELECT * FROM jotdown.Orders WHERE orderid = '${orderId}' ALLOW FILTERING;
            `).then(async (r)=>{
                const order:order=r.rows[0] as unknown as order
                await this.client.execute(`UPDATE orders SET orderstatus='NF',assignedWriterId='' WHERE orderId='${order.orderid}' AND id='${order.id}'`)
                await this.client.execute(`UPDATE "${order.id}Orders" SET orderstatus='NF',assignedWriterId='${uuid}' WHERE orderId='${order.orderid}' AND id='${order.id}'`)
                await this.tableDelete({uuid},order)
                resolve()
              },()=>{reject({})})
          }
        }))
      })
    }
    private tableInsert({ userid, uuid, status }: { userid?: string, uuid?: string, status: adminPanelOrderStatus }, order: order): Promise<void> {
      console.log('executed');
      return new Promise(async (resolve, reject) => {
          var call = '';
          if (!userid && uuid) call = `"${uuid}writerOrders"`;
          if (!uuid && userid) call = `"${userid}Orders"`;
          if (!uuid && !userid) call = `orders`;

          try {  
            await this.client.execute(`
              INSERT INTO ${this.keyspace}.${call}
              (orderId, id, orderType, pageNumber, decorNumber, diagramNumber, instructions, fileLinks, totalAmount, orderStatus, timeStamp, paymentId, ogFileName, serverFileName,fulladdress,ogwriterfilename,serverwriterfilename,writerfilelinks)
              VALUES ('${order.orderid}', '${order.id}', '${order.ordertype}', '${order.pagenumber}', '${order.decornumber}', '${order.diagramnumber}', '${order.instructions}', '${order.filelinks}', '${order.totalamount}', '${status}', '${order.timestamp}', '${order.paymentid}', '${order.ogfilename}', '${order.serverfilename}','${order.fulladdress}','${order.ogwriterfilename}','${order.serverwriterfilename}','${order.writerfilelinks}')
              IF NOT EXISTS;
            `).then(() => resolve());
          } catch (error) {
            console.error(error);
            reject();
          }
        });
  }
  
    public async tableDelete({userid,uuid}:{userid?:string,uuid?:string},order:order):Promise<any>{
      return new Promise(async (resolve,reject)=>{
        var call=''
        if(!userid && uuid ) call =`"${uuid}writerOrders"`
        if(!uuid && userid ) call =`"${userid}Orders"`
        if(!uuid && !userid) call=`orders`
        await this.client.execute(`DELETE FROM ${this.keyspace}.${call}
                WHERE orderid='${order.orderid}' AND id='${order.id}'`).then(r=>resolve(r as unknown as order))
         })
      
    }
    public async createGenericTable({userid,uuid}:{userid?:string,uuid?:string}):Promise<void>{
      return new Promise(async (resolve,reject)=>{
        var call=''
        if(!userid && uuid ) call =`"${uuid}writerOrders"`
        if(!uuid && userid ) call =`"${userid}Orders"`
        if(!uuid && !userid) call=`orders`

        try {
          await this.client.execute(`CREATE TABLE IF NOT EXISTS ${this.keyspace}.${call}(
            orderId text ,
            id text,
            orderType text,
            pageNumber text,
            decorNumber text,
            diagramNumber text,
            instructions text,
            fileLinks text,
            totalAmount text,
            orderStatus text,
            timeStamp text,
            paymentId text,
            ogFileName text,
            serverFileName text,
            assignedWriterId text,
            fulladdress text,
            ogwriterfilename text,
            serverwriterfilename text,
            writerfilelinks text,
            PRIMARY KEY(orderId,id)
          );`)
          resolve()
        } catch (error) {
          reject()
        }

      })

      
    }
    public async adminOrders(Object:credentialsJson):Promise<Object>{
      return new Promise(async (resolve,reject)=>{
        await this.client.execute(`
        SELECT * FROM jotdown.Orders WHERE orderstatus = '${Object.orderstatus}' ALLOW FILTERING;
        `).then((r)=>{resolve(r.rows);return;},()=>{reject({})})
      })
    }
    public async writerOrders(Object:credentialsJson):Promise<Object>{
      return new Promise(async (resolve,reject)=>{
        await this.client.execute(`
        SELECT * FROM jotdown."${Object.uuid}writerOrders";
        `).then((r)=>{resolve(r.rows);return;},()=>{reject({})})
      })
    }
  client:Client
  keyspace:string
}  

  //id name picture email