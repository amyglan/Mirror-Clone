import type {NextApiRequest, NextApiResponse} from 'next';
import ArDB from 'ardb';
import {DataT} from '@/types';

import {initialize} from 'lib/arweave';

const arweave = initialize();

const getData = async (txId: string) => {
  const buffer = (await arweave.transactions.getData(txId, {
    decode: true,
    string: true,
  })) as string;
  return {
    transactionId: txId,
    buffer: JSON.parse(buffer),
  };
};

export default async function (
  _req: NextApiRequest,
  res: NextApiResponse<DataT[] | string>,
): Promise<any> {
  try {
    const {query} = _req.query;

    const ardb = new ArDB(arweave);
    const tags = [{ name: "App-Name", values: [process.env.APP_NAME as string] }];
    // More information about ArDB can be found here: https://www.npmjs.com/package/ardb

    const searchAddress = query && query[0];
    if(searchAddress) {
      tags.push({name: "Address",values: [searchAddress]});
    }

    const txs = await ardb.search("transactions").tags(tags).limit(10).find();
    
    // Build tags

    // Search for transaction withs App-Name and Address (optional) tags
    // More information can be found here: https://www.npmjs.com/package/ardb

    const promises = txs.map((tx: any) => getData(tx._id));
    const data = await Promise.all(promises);

    res.status(200).json(data);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown Error';
    res.status(500).json(errorMessage);
  }
}
