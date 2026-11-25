const { parseInvoiceText, splitVehicleDescription } = require('../helpers/invoiceParser');

// Text as produced by extractInvoiceText: one line per row, cells split by \t.
// Buyer details are placeholders.
const COPART_PAID = [
  'Sales Receipt/Bill of Sale\tDate: 11/13/26 03:55 PM',
  'PHYSICAL ADDRESS OF',
  'MEMBER: 100000\tSELLER:',
  'LOT:',
  'BUYER LLC\tENTERPRISE VEHICLE',
  'SOLD THROUGH COPART',
  'SOME CITY,AM 0043\tBROOKHAVEN NY 11719\t061423251',
  "BIDDER'S MASTER BUYER: 900000\tBROOKHAVEN,NY 11719",
  'LOT#: 75247856\tSale Yard: 838\tItem#: 4034',
  'VEHICLE: 2026 KIA K5 LXS BLACK\tPhy Yard: 30\tKeys: YES',
  'VIN: KNAG24J7XT5442199\tRow: A150\tSale: 11/09/2026',
  'Charges and Payments',
  'Date\tCharges\tAmount\tDescription',
  '11/09/2026\tSale Price\t$3,350.00',
  '11/09/2026\tEnvironmental Fee\t$15.00',
  '11/09/2026\tVirtual Bid Fee\t$110.00',
  '11/09/2026\tGate Fee\t$95.00',
  '11/11/2026\tTitle Pickup Fee\t$20.00',
  '11/12/2026\tStorage\t$5.00\tFROM 11/12/26 - 11/12/26',
  '11/12/2026\tLate Payment\t$50.00',
  '11/13/2026\tStorage\t$10.00\tFROM 11/13/26 - 11/13/26',
  '11/13/2026\tLate Payment\t-$50.00',
  '11/12/2026\tBuyer Fee\t$505.00',
  '11/12/2026\tPayment\t-$4,150.00\tWire Payment, REF# 1',
  '11/13/2026\tPayment\t$40.00\tWire Payment, REF# 1',
  'Net Due (USD)\t$0.00',
  'PAID THROUGH:11/13/2026',
].join('\n');

const COPART_UNPAID = [
  'Sales Receipt/Bill of Sale\tDate: 11/13/26 01:45 PM',
  'CA - SUN VALLEY',
  'SOME STREET 1\tSOLD THROUGH',
  'SHENGAVIT\tCOPART',
  'SUN VALLEY CA 91352',
  'LOT#: 75847986\tSale Yard: 180\tItem#: 2585/S',
  'VEHICLE: 2019 JAGUAR I-PACE FIRST EDITION BLACK\tPhy Yard: 180\tKeys: NO',
  'VIN: SADHD2S18K1F62578\tRow: D090\tSale: 11/11/2026',
  'Date\tCharges\tAmount\tDescription',
  '11/11/2026\tSale Price\t$3,650.00',
  '11/11/2026\tEnvironmental Fee\t$15.00',
  '11/11/2026\tVirtual Bid Fee\t$110.00',
  '11/11/2026\tGate Fee\t$95.00',
  '11/11/2026\tTitle Pickup Fee\t$20.00',
  '11/11/2026\tBuyer Fee\t$555.00',
  'Net Due (USD)\t$4,445.00',
].join('\n');

const IAA = [
  'Buyer Receipt',
  'Receipt #\t27723808',
  'Receipt Date\t11/13/2026',
  'Insurance Auto Auctions Corp',
  'Sold At Branch\t442 - San Antonio-South',
  'Pick-Up Location:\tSale Date\t11/9/2026',
  'San Antonio Texas 78224\tBuyer Name\tBUYER LLC',
  'Registration Expires\t11/4/2027',
  'Sale\tLicense',
  'StockNo\tItem #\tYear\tMake\tModel\tColor\tMileage\tVIN\tPlate #',
  '000-46020192\tD-0196\t2023\tFORD\tRANGER\tGray\t52,200\t1FTER4FH2PLE22599',
  'Invoice To:\tDescription\tCharges\tPayments\tBalance',
  'BUYER LLC\tBid Amount\t$6,250.00',
  'Buyer Fee\t$825.00',
  'Service Fee\t$105.00',
  'Title Handling Fee\t$20.00',
  'Internet Fee\t$145.00',
  'SOME CITY, XX. 00018\tEH&S and Fuel Surcharge\t$25.00',
  'Premium Imagery Set\t$10.00',
  'Check # / Reference No.',
  'Account Credit - $22,470.00',
  'Total Payment\t$22,470.00',
  'Amount:\t11/13/2026 9:43:00 AM - Payment\t$7,380.00',
  'Remaining Amount Due\t$0.00',
  'PAID IN FULL\tTotal\t$7,380.00\t$7,380.00\t$0.00',
  'Sold At (USPPI):\t442 - San Antonio-South\t11275 S. Zarzamora St., San Antonio, TX , 78224. (210) 628-6770',
  'IAA Doc: RP018.00\t11/13/2026 9:46:00 AM\tPage 1 of 1',
].join('\n');

describe('invoiceParser', () => {
  test('Copart paid invoice', () => {
    const r = parseInvoiceText(COPART_PAID);
    expect(r).toMatchObject({
      auction: 'Copart', lot_number: '75247856', vin: 'KNAG24J7XT5442199',
      year: '2026', mark: 'KIA', model: 'K5 LXS', color: 'BLACK', has_key: true,
      purchase_date: '2026-11-09', city: 'BROOKHAVEN', state: 'NY',
      sale_price: 3350, total_amount: 4110, paid_amount: 4110, balance_due: 0,
      payment_date: '2026-11-12',
    });
    expect(r.charges).toHaveLength(10);
  });

  test('Copart unpaid invoice', () => {
    expect(parseInvoiceText(COPART_UNPAID)).toMatchObject({
      auction: 'Copart', lot_number: '75847986', vin: 'SADHD2S18K1F62578',
      year: '2019', mark: 'JAGUAR', model: 'I-PACE FIRST EDITION', color: 'BLACK', has_key: false,
      purchase_date: '2026-11-11', city: 'SUN VALLEY', state: 'CA',
      sale_price: 3650, total_amount: 4445, paid_amount: 0, balance_due: 4445,
    });
  });

  test('IAA buyer receipt', () => {
    const r = parseInvoiceText(IAA);
    expect(r).toMatchObject({
      auction: 'IAAI', lot_number: '46020192', vin: '1FTER4FH2PLE22599',
      year: '2023', mark: 'FORD', model: 'RANGER', color: 'GRAY', mileage: 52200,
      purchase_date: '2026-11-09', city: 'SAN ANTONIO', state: 'TX',
      sale_price: 6250, total_amount: 7380, paid_amount: 7380, balance_due: 0,
      payment_date: '2026-11-13',
    });
    expect(r.charges).toHaveLength(7);
  });

  test('unrelated or VIN-less text is rejected', () => {
    expect(parseInvoiceText('Some random document\nTotal\t$10.00')).toBeNull();
    expect(parseInvoiceText('Copart\nLOT#: 123')).toBeNull();
    expect(parseInvoiceText('')).toBeNull();
  });

  test('vehicle description: multi-word makes and missing color', () => {
    expect(splitVehicleDescription('LAND ROVER RANGE ROVER SPORT WHITE')).toEqual({ mark: 'LAND ROVER', model: 'RANGE ROVER SPORT', color: 'WHITE' });
    expect(splitVehicleDescription('MERCEDES-BENZ GLE 350 4MATIC TWO TONE')).toEqual({ mark: 'MERCEDES-BENZ', model: 'GLE 350 4MATIC', color: 'TWO TONE' });
    expect(splitVehicleDescription('TOYOTA CAMRY LE')).toEqual({ mark: 'TOYOTA', model: 'CAMRY LE', color: null });
  });
});
