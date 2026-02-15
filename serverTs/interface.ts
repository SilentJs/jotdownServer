export interface order{
    orderid?:string;
    id:string;
    ordertype:string,
    pagenumber:string,
    decornumber:string,
    diagramnumber:string,
    instructions:string,
    filelinks:string,
    totalamount:string,
    orderstatus?:string,
    timestamp?:string
    paymentid:string,
    ogfilename:string | null,
    serverfilename:string,
    assignedwriterid?:string,
    fulladdress:string,
    fullwriteraddress?:string,
    ogwriterfilename?:string,
    serverwriterfilename?:string,
    writerfilelinks?:string,
} 
export interface credentialsJson{
    type:'admin' | 'writer' | 'jwtToken';
    uuid?:string;
    username?:string;
    password:string;
    jwtToken?:string;
    orderstatus?:string;
}
export type adminPanelAction = "WA" | "WDA"
export type adminPanelOrderStatus = 'NF' | 'SA' | 'AS' | 'PI' | 'DS' | 'FF'
export interface tokenJson{
    jwtToken:string,
    settings:{
        action:adminPanelAction,        //WA: Writer Assign WDA: Writer Deassign
        orderId:string,
        writerId:string
    },
    orderstatus:adminPanelOrderStatus
}  
  