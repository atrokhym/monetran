const fs = require('fs');
import { Config } from './src/config';

/*

Issuer:
Public Key  GBFBF57EJ4BIBFQJM2MUHYU4MQZLUAENXKXK3XGX24DDDMDRZMKFQ24B
Secret Key  SABD5ENNH3LR5ME3WUY7YY3LGDKW3QKNI2GQS7D3Q4SAGM3VS5MNQFCZ

Distribution:
Public Key  GCR4PPTA7ZYIP23Q3JOFXOXPSBVBQHUG43I4OFQKUO2NTZSGSQNTQOWQ
Secret Key  SCWYNR4W6QDRPCHCQPABW6X6MGN2QKV6VOQ5DSVVKS7HMYP25UNCMVGW

*/

const lines = [
  `port = ${Config.BRIDGE_PORT}`,
  `horizon = "${Config.HORIZON_URL}"`,
  `network_passphrase = "${Config.NETWORK_PASSPHRASE}"`,
  '[[assets]]',
  `code = "${Config.ASSETS_CODE}"`,
  `issuer = "${Config.ASSETS_ISSUER}"`,
  '[database]',
  `type = "${Config.DATABASE_TYPE}"`,
  `url = "${Config.DATABASE_URL}"`,
  '[accounts]',
  `base_seed = "${Config.ISSUER_SEED}"`,
  `receiving_account_id = "${Config.ISSUER_ID}"`,
  '[callbacks]',
  `receive =  "${Config.WITHDRAW_ENDPOINT}"`
];
const lineBreak = '\n';

const bridgeCfgContent = lines.join(lineBreak);
const bridgeCfgPath = 'bridge.cfg';

fs.writeFile(bridgeCfgPath, bridgeCfgContent, (err: any) => {
  if (err) {
    throw err;
  }

  console.log(
    'The bridge config file was succesfully generated from your environment variables!'
  );
});
