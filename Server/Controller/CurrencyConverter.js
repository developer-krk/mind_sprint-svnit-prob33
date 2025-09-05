const axios = require('axios')
const price = async (amount,oCurr,tCurr)=>{
    const res = await axios.get(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${oCurr}.json`)
    return ((res.data[oCurr][tCurr])*amount)

}

module.exports = {price}