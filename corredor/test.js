// Don't forget to add this package
//import base64 from 'base-64'
// https://stackabuse.com/executing-shell-commands-with-node-js/


//import axios from 'axios'
//import { apiClients } from '@cortezaproject/corteza-js'

export default {
    label: "Workflow Test",
    description: "Hey",
  
    triggers ({ on }) {
      /**
       * Due to how the Corredor scripting system is designed right now,
       * triggers still need to be defined (even if the script is
       * executed explicitly from the workflow).
       */
      return on('manual')
          .for('system')
    },
  
    security: {
      runAs: 'TN'
    },
  
    async exec (args, { Compose, System }) {
      // unpack arguments
      const { webID, workflow, webseite } = args
  
  const namespace = await Compose.resolveNamespace('crm')
  //const namespace = await Compose.findNamespaceBySlug('crm')
  
  //      Compose.$namespace="server"
  //      Compose.$module="ssl_module"
  //    const contact = await Compose.findRecordByID(webID, 'Server')
  //    let webRecord
  //    const ns = await Compose.resolveNamespace('server')
  //  console.debug(apiClients.Compose)
  ////  webseite.values.Email="test@test.de"
  
  //// await apiClients.Compose.recordUpdate(webseite)
  //    const mod = await Compose.findModuleByHandle('ssl_module', 'server')
  //    webRecord = await Compose.findRecordByID(webID, 'server')
  //      webseite.values.Email="test@test.de"
  //      await Compose.saveRecord(webseite)
  
      // log all arguments
  //    logger.debug('these are the special arguments we received', { webseite, workflow })
  
      //args.Email="t.nissen@hyconcept.de"
      //await Compose.saveRecord(args)
  ////return webseite 
    }
  
  }
  