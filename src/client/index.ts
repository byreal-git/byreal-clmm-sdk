import { Connection, PublicKey } from '@solana/web3.js';

import { CLMM_PROGRAM_ID } from '../constants.js';
import { IPoolLayoutWithId } from '../instructions/models.js';

import { Api, IApiParams } from './apis/index.js';
import { IPoolsReq, IPoolsByIdsReq } from './apis/poolsModels.js';
import { IMyPositionsReq } from './apis/positionModels.js';
import { ITickReq } from './apis/tickModels.js';
import { Chain } from './chain/index.js';
import { ICollectFeesParams } from './chain/models.js';
import { ParamsWithSignerCallback } from './chain/models.js';
import { CLMMClient } from './liquidity/clmm.js';
import { Token } from './token.js';

export class SdkClient {
  public api: Api;
  public chain: Chain;
  public clmmClient: CLMMClient;
  public connection: Connection;
  public programId: PublicKey;
  public token: Token;

  constructor(params: { connection: Connection; programId?: PublicKey; apiConfig?: IApiParams }) {
    const { connection, programId = CLMM_PROGRAM_ID, apiConfig } = params;
    this.connection = connection;
    this.programId = programId;
    this.api = new Api(apiConfig);
    this.chain = new Chain({ connection, programId });
    this.clmmClient = new CLMMClient({ chain: this.chain });
    this.token = new Token(connection);
  }

  // Get pool list
  async getPools(req: IPoolsReq) {
    return this.api.getPools(req);
  }

  // Get pool details by ids
  async getPoolsByIds(req: IPoolsByIdsReq) {
    const result = await this.api.getPoolsByIds(req);

    return result;
  }

  // Get user positions
  async getMyPositions(req: IMyPositionsReq) {
    return this.api.getMyPositions(req);
  }

  // Collect single position fees
  collectFees(params: ParamsWithSignerCallback<ICollectFeesParams>) {
    return this.chain.collectFees(params);
  }

  // Get tick information
  async getTicks(req: ITickReq) {
    return this.api.getTicks(req);
  }

  /**
   *
   * @param id Pool address
   * @returns
   */
  async getRawPoolInfoByPoolId(id: string): Promise<IPoolLayoutWithId> {
    return this.chain.getRawPoolInfoByPoolId(id);
  }

  async getPositionNftMintListByUserAddress(userAddress: PublicKey): Promise<PublicKey[]> {
    const positionList = await this.chain.getRawPositionInfoListByUserAddress(userAddress);
    return positionList.map((position) => position.nftMint);
  }
}

export * from './chain/index.js';
export * from './chain/models.js';
export * from './apis/index.js';
export * from './apis/ky.js';
export * from './liquidity/clmm.js';
export * from './apis/poolsModels.js';
export * from './apis/swapModels.js';
export * from './apis/positionModels.js';
export * from './apis/tickModels.js';
