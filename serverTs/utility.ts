export function superLongUUID():string{
    const letterArray = [ 0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
    let uuidVar = ''
    for (let i = 0; i < 32; i++) {
        const element = letterArray[Math.round(Math.random()*60)];
        uuidVar+=element
    }
    return uuidVar
}
export function generateTimestamp(): { date: string; time: string } {
    const currentDate = new Date();
  
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
  
    const hours = currentDate.getHours() % 12 || 12;
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const ampm = currentDate.getHours() >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hours}:${minutes}${ampm}`;
  
    return { date: formattedDate, time: formattedTime };
}
