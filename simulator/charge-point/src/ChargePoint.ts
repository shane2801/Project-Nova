import { RPCClient, IHandlersOption } from 'ocpp-rpc';

export interface ChargePointConfig {
  identity: string;
  csmsUrl: string;
}

export type ConnectorStatus =
  | 'Available'
  | 'Preparing'
  | 'Charging'
  | 'SuspendedEVSE'
  | 'SuspendedEV'
  | 'Finishing'
  | 'Reserved'
  | 'Unavailable'
  | 'Faulted';

export class ChargePoint {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  readonly identity: string;

  constructor(config: ChargePointConfig) {
    this.identity = config.identity;
    // Library typedef marks every option as required; most have defaults internally
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.client = new (RPCClient as any)({
      endpoint: config.csmsUrl,
      identity: config.identity,
      protocols: ['ocpp1.6'],
      strictMode: true,
    });
  }

  async connect(vendor = 'Acme', model = 'EV-Simulator'): Promise<void> {
    await this.client.connect();
    const boot = await this.client.call('BootNotification', {
      chargePointVendor: vendor,
      chargePointModel: model,
      chargePointSerialNumber: `SN-${this.identity}`,
      firmwareVersion: '1.0.0',
    });
    if ((boot as { status: string }).status !== 'Accepted') {
      throw new Error('BootNotification rejected by CSMS');
    }
  }

  async setStatus(connectorId: number, status: ConnectorStatus): Promise<void> {
    await this.client.call('StatusNotification', {
      connectorId,
      status,
      errorCode: 'NoError',
      timestamp: new Date().toISOString(),
    });
  }

  async authorize(idTag: string): Promise<boolean> {
    const resp = await this.client.call('Authorize', { idTag });
    return (resp as { idTagInfo: { status: string } }).idTagInfo.status === 'Accepted';
  }

  async startTransaction(connectorId: number, idTag: string, meterStart: number): Promise<number> {
    const resp = await this.client.call('StartTransaction', {
      connectorId,
      idTag,
      meterStart,
      timestamp: new Date().toISOString(),
    });
    const r = resp as { transactionId: number; idTagInfo: { status: string } };
    if (r.idTagInfo.status !== 'Accepted') {
      throw new Error(`StartTransaction rejected: ${r.idTagInfo.status}`);
    }
    return r.transactionId;
  }

  async sendMeterValues(connectorId: number, transactionId: number, energyWh: number): Promise<void> {
    await this.client.call('MeterValues', {
      connectorId,
      transactionId,
      meterValue: [{
        timestamp: new Date().toISOString(),
        sampledValue: [{
          value: String(energyWh),
          measurand: 'Energy.Active.Import.Register',
          unit: 'Wh',
        }],
      }],
    });
  }

  async stopTransaction(transactionId: number, meterStop: number, reason = 'Local'): Promise<void> {
    await this.client.call('StopTransaction', {
      transactionId,
      meterStop,
      timestamp: new Date().toISOString(),
      reason,
    });
  }

  async sendHeartbeat(): Promise<void> {
    await this.client.call('Heartbeat', {});
  }

  /** Register a handler for RemoteStartTransaction sent by the CSMS. */
  onRemoteStart(handler: (connectorId: number, idTag: string) => void): void {
    this.client.handle('RemoteStartTransaction', ({ params }: IHandlersOption) => {
      const p = params as { connectorId?: number; idTag: string };
      handler(p.connectorId ?? 1, p.idTag);
      return Promise.resolve({ status: 'Accepted' });
    });
  }

  /** Register a handler for RemoteStopTransaction sent by the CSMS. */
  onRemoteStop(handler: (transactionId: number) => void): void {
    this.client.handle('RemoteStopTransaction', ({ params }: IHandlersOption) => {
      const p = params as { transactionId: number };
      handler(p.transactionId);
      return Promise.resolve({ status: 'Accepted' });
    });
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }
}
