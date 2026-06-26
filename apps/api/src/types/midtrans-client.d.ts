declare module 'midtrans-client' {
  interface SnapTransactionResult {
    token: string;
    redirect_url: string;
  }

  interface SnapTransactionParams {
    transaction_details: {
      order_id: string;
      gross_amount: number;
    };
    customer_details?: {
      first_name?: string;
      email?: string;
    };
    item_details?: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    credit_card?: {
      secure?: boolean;
    };
  }

  class Snap {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    });
    createTransaction(params: SnapTransactionParams): Promise<SnapTransactionResult>;
  }

  export default { Snap };
}
