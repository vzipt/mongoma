import MongoManager from './mongo_manager'

const mongo = new MongoManager()

mongo.start()

setTimeout(()=>{
mongo.stop()
}, 2000)