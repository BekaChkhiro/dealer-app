const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { uploadToR2 } = require('../config/r2');

// Stock car image URLs (free-to-use from Unsplash)
const CAR_IMAGES = [
  'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800',  // red sports car
  'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800',  // white sedan
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',  // red ferrari
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',  // white car
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',  // porsche
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',  // bmw
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',  // mercedes
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800',  // bmw blue
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',  // corvette
  'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=800',  // tesla
  'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800',  // toyota
  'https://images.unsplash.com/photo-1606611013016-969c19ba27dc?w=800',  // suv
  'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',  // mercedes amg
  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800',  // audi
  'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',  // ford
  'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800',  // hyundai
];

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer;
}

async function uploadCarImage(imageUrl, lotNumber, index) {
  try {
    const buffer = await downloadImage(imageUrl);
    const key = `cars/demo_${Date.now()}_${index}_${lotNumber}.jpg`;
    const r2Url = await uploadToR2(buffer, key, 'image/jpeg');
    console.log(`  Uploaded image for lot ${lotNumber}`);
    return r2Url;
  } catch (err) {
    console.error(`  Failed to upload image: ${err.message}`);
    return null;
  }
}

// ====== DEMO DATA ======

const USERS = [
  {
    name: 'Admin', surname: 'Administrator', email: 'admin@dealer.ge',
    username: 'admin', password: 'admin123', balance: 25000.00,
    phone: '+995 555 100 100', calculator_category: 'A', role: 'admin',
    identity_number: '01001080001', superviser_fee: 0, debt: 0,
  },
  {
    name: 'გიორგი', surname: 'კაპანაძე', email: 'giorgi@dealer.ge',
    username: 'giorgi', password: 'dealer123', balance: 12500.50,
    phone: '+995 555 200 200', calculator_category: 'A', role: 'user',
    identity_number: '01001090002', superviser_fee: 150, debt: 3200.00,
  },
  {
    name: 'ნიკა', surname: 'ბერიძე', email: 'nika@dealer.ge',
    username: 'nika', password: 'dealer123', balance: 8300.00,
    phone: '+995 555 300 300', calculator_category: 'B', role: 'user',
    identity_number: '01001070003', superviser_fee: 200, debt: 1500.00,
  },
  {
    name: 'დავით', surname: 'მაისურაძე', email: 'davit@dealer.ge',
    username: 'davit', password: 'dealer123', balance: 45000.00,
    phone: '+995 555 400 400', calculator_category: 'A', role: 'user',
    identity_number: '01001060004', superviser_fee: 100, debt: 0,
  },
  {
    name: 'ლევან', surname: 'ჯანაშია', email: 'levan@dealer.ge',
    username: 'levan', password: 'dealer123', balance: 3200.00,
    phone: '+995 555 500 500', calculator_category: 'B', role: 'user',
    identity_number: '01001050005', superviser_fee: 175, debt: 7800.00,
  },
];

const BOATS = [
  {
    name: 'CAPE TAINARO', identification_code: 'IMO-9365597',
    departure_date: '2025-01-15', estimated_arrival_date: '2025-02-18',
    arrival_date: '2025-02-20', status: 'delivered',
  },
  {
    name: 'MSC AURORA', identification_code: 'IMO-9484525',
    departure_date: '2025-01-28', estimated_arrival_date: '2025-03-01',
    arrival_date: '2025-02-28', status: 'arrived',
  },
  {
    name: 'MAERSK SELETAR', identification_code: 'IMO-9502937',
    departure_date: '2025-02-05', estimated_arrival_date: '2025-03-10',
    arrival_date: null, status: 'in_transit',
  },
  {
    name: 'ZIM CONSTANZA', identification_code: 'IMO-9413898',
    departure_date: null, estimated_arrival_date: '2025-03-25',
    arrival_date: null, status: 'us_port',
  },
];

const VEHICLES = [
  {
    buyer: 'გიორგი კაპანაძე', dealer_idx: 1, receiver_fullname: 'ალექსანდრე თოფურია',
    receiver_identity_number: '60001070001', mark: 'MERCEDES-BENZ', model: 'E-Class W213',
    year: 2021, vin: '1HGCM82633A004352', lot_number: 'LOT-78451236',
    auction: 'Copart', receiver_phone: '+995 599 100 100', us_state: 'CA-LOS ANGELES',
    destination_port: 'ფოთი', us_port: 'Long Beach', line: 'MSC',
    current_status: 'arrived', vehicle_price: 18500.00, total_price: 22300.00,
    payed_amount: 22300.00, debt_amount: 0, container_number: 'MSCU-7654321',
    booking: 'BK-2025-001', dealer_fee: 500, status_color: 'green',
    buyer_number: 'BN-001', has_key: true, doc_type: 'CLEAN', vehicle_type: 'sedan',
    is_hybrid: false, is_fully_paid: true, is_partially_paid: false,
    is_funded: false, is_insured: true, is_sublot: false,
    purchase_date: '2025-01-05', vehicle_pickup_date: '2025-01-08',
    warehouse_receive_date: '2025-01-12', container_loading_date: '2025-01-15',
    estimated_receive_date: '2025-02-18', receive_date: '2025-02-20',
    container_open_date: '2025-02-21', container_receive_date: '2025-02-22',
    container_cost: 1200, landing_cost: 800,
    driver_fullname: 'ზურაბ გელაშვილი', driver_phone: '+995 599 900 100',
    driver_car_license_number: 'AA-001-AA', driver_company: 'TransGeo',
  },
  {
    buyer: 'გიორგი კაპანაძე', dealer_idx: 1, receiver_fullname: 'მარიამ ხარაიშვილი',
    receiver_identity_number: '60001070002', mark: 'BMW', model: 'X5 G05',
    year: 2022, vin: 'WBAPH5C55BA271190', lot_number: 'LOT-78451237',
    auction: 'IAAI', receiver_phone: '+995 599 100 200', us_state: 'NV-LAS VEGAS WEST',
    destination_port: 'ფოთი', us_port: 'Newark', line: 'Maersk',
    current_status: 'in_transit', vehicle_price: 32000.00, total_price: 37500.00,
    payed_amount: 20000.00, debt_amount: 17500.00, container_number: 'MSKU-1234567',
    booking: 'BK-2025-002', dealer_fee: 700, status_color: 'yellow',
    buyer_number: 'BN-002', has_key: true, doc_type: 'SALVAGE', vehicle_type: 'suv',
    is_hybrid: false, is_fully_paid: false, is_partially_paid: true,
    is_funded: false, is_insured: true, is_sublot: false,
    purchase_date: '2025-01-20', vehicle_pickup_date: '2025-01-23',
    warehouse_receive_date: '2025-01-28', container_loading_date: '2025-02-05',
    estimated_receive_date: '2025-03-10', receive_date: null,
    container_cost: 1400, landing_cost: 900,
  },
  {
    buyer: 'ნიკა ბერიძე', dealer_idx: 2, receiver_fullname: 'გიორგი მელაძე',
    receiver_identity_number: '60001070003', mark: 'TOYOTA', model: 'Camry',
    year: 2023, vin: '4T1BF1FK5CU510270', lot_number: 'LOT-78451238',
    auction: 'Copart', receiver_phone: '+995 599 200 100', us_state: 'TX-HOUSTON',
    destination_port: 'ბათუმი', us_port: 'Houston', line: 'ZIM',
    current_status: 'arrived', vehicle_price: 15200.00, total_price: 19800.00,
    payed_amount: 19800.00, debt_amount: 0, container_number: 'ZIMU-9876543',
    booking: 'BK-2025-003', dealer_fee: 400, status_color: 'green',
    buyer_number: 'BN-003', has_key: true, doc_type: 'CLEAN', vehicle_type: 'sedan',
    is_hybrid: true, is_fully_paid: true, is_partially_paid: false,
    is_funded: false, is_insured: true, is_sublot: false,
    purchase_date: '2025-01-10', vehicle_pickup_date: '2025-01-13',
    warehouse_receive_date: '2025-01-18', container_loading_date: '2025-01-22',
    estimated_receive_date: '2025-02-20', receive_date: '2025-02-22',
    container_cost: 1100, landing_cost: 700,
    driver_fullname: 'ლაშა ბაქრაძე', driver_phone: '+995 599 900 200',
    driver_car_license_number: 'BB-002-BB', driver_company: 'AutoDelivery',
  },
  {
    buyer: 'ნიკა ბერიძე', dealer_idx: 2, receiver_fullname: 'ნინო წიკლაური',
    receiver_identity_number: '60001070004', mark: 'FORD', model: 'Mustang GT',
    year: 2020, vin: '1FA6P8CF1L5100001', lot_number: 'LOT-78451239',
    auction: 'Copart', receiver_phone: '+995 599 200 200', us_state: 'FL-MIAMI SOUTH',
    destination_port: 'ფოთი', us_port: 'Jacksonville', line: 'MSC',
    current_status: 'in_transit', vehicle_price: 22000.00, total_price: 27200.00,
    payed_amount: 10000.00, debt_amount: 17200.00, container_number: 'MSCU-1112233',
    booking: 'BK-2025-004', dealer_fee: 600, status_color: 'yellow',
    buyer_number: 'BN-004', has_key: false, doc_type: 'SALVAGE', vehicle_type: 'coupe',
    is_hybrid: false, is_fully_paid: false, is_partially_paid: true,
    is_funded: true, is_insured: false, is_sublot: false,
    purchase_date: '2025-02-01', vehicle_pickup_date: '2025-02-04',
    warehouse_receive_date: '2025-02-08', container_loading_date: '2025-02-12',
    estimated_receive_date: '2025-03-15', receive_date: null,
    container_cost: 1300, landing_cost: 850,
  },
  {
    buyer: 'დავით მაისურაძე', dealer_idx: 3, receiver_fullname: 'თამარ ჩხეიძე',
    receiver_identity_number: '60001070005', mark: 'AUDI', model: 'A6 C8',
    year: 2022, vin: 'WAUZZZ4G6JN000001', lot_number: 'LOT-78451240',
    auction: 'IAAI', receiver_phone: '+995 599 300 100', us_state: 'NY-LONG ISLAND',
    destination_port: 'ფოთი', us_port: 'Newark', line: 'Maersk',
    current_status: 'arrived', vehicle_price: 28000.00, total_price: 33500.00,
    payed_amount: 33500.00, debt_amount: 0, container_number: 'MSKU-4455667',
    booking: 'BK-2025-005', dealer_fee: 650, status_color: 'green',
    buyer_number: 'BN-005', has_key: true, doc_type: 'CLEAN', vehicle_type: 'sedan',
    is_hybrid: false, is_fully_paid: true, is_partially_paid: false,
    is_funded: false, is_insured: true, is_sublot: false,
    purchase_date: '2025-01-08', vehicle_pickup_date: '2025-01-11',
    warehouse_receive_date: '2025-01-15', container_loading_date: '2025-01-18',
    estimated_receive_date: '2025-02-15', receive_date: '2025-02-17',
    container_cost: 1500, landing_cost: 950,
    driver_fullname: 'გიორგი ბარნაბიშვილი', driver_phone: '+995 599 900 300',
    driver_car_license_number: 'CC-003-CC', driver_company: 'SpeedLogistics',
  },
  {
    buyer: 'დავით მაისურაძე', dealer_idx: 3, receiver_fullname: 'ლუკა ჯავახიშვილი',
    receiver_identity_number: '60001070006', mark: 'PORSCHE', model: 'Cayenne',
    year: 2021, vin: 'WP1AA2AY5MDA00001', lot_number: 'LOT-78451241',
    auction: 'Copart', receiver_phone: '+995 599 300 200', us_state: 'GA-ATLANTA SOUTH',
    destination_port: 'ბათუმი', us_port: 'Savannah', line: 'ZIM',
    current_status: 'booked', vehicle_price: 45000.00, total_price: 52000.00,
    payed_amount: 0, debt_amount: 52000.00, container_number: null,
    booking: null, dealer_fee: 900, status_color: 'red',
    buyer_number: 'BN-006', has_key: true, doc_type: 'CLEAN', vehicle_type: 'suv',
    is_hybrid: true, is_fully_paid: false, is_partially_paid: false,
    is_funded: false, is_insured: false, is_sublot: false,
    purchase_date: '2025-02-10', vehicle_pickup_date: null,
    warehouse_receive_date: null, container_loading_date: null,
    estimated_receive_date: '2025-03-25', receive_date: null,
    container_cost: 0, landing_cost: 0,
  },
  {
    buyer: 'დავით მაისურაძე', dealer_idx: 3, receiver_fullname: 'ანა ნოზაძე',
    receiver_identity_number: '60001070007', mark: 'TESLA', model: 'Model 3',
    year: 2023, vin: '5YJ3E1EA1PF000001', lot_number: 'LOT-78451242',
    auction: 'Copart', receiver_phone: '+995 599 300 300', us_state: 'CA-SAN DIEGO',
    destination_port: 'ფოთი', us_port: 'Long Beach', line: 'MSC',
    current_status: 'in_transit', vehicle_price: 25000.00, total_price: 30200.00,
    payed_amount: 30200.00, debt_amount: 0, container_number: 'MSCU-7778899',
    booking: 'BK-2025-006', dealer_fee: 550, status_color: 'yellow',
    buyer_number: 'BN-007', has_key: true, doc_type: 'CLEAN', vehicle_type: 'sedan',
    is_hybrid: true, is_fully_paid: true, is_partially_paid: false,
    is_funded: false, is_insured: true, is_sublot: false,
    purchase_date: '2025-01-25', vehicle_pickup_date: '2025-01-28',
    warehouse_receive_date: '2025-02-01', container_loading_date: '2025-02-05',
    estimated_receive_date: '2025-03-10', receive_date: null,
    container_cost: 1250, landing_cost: 800,
  },
  {
    buyer: 'ლევან ჯანაშია', dealer_idx: 4, receiver_fullname: 'ზაზა გოგიჩაიშვილი',
    receiver_identity_number: '60001070008', mark: 'HYUNDAI', model: 'Tucson',
    year: 2022, vin: 'KM8J3CA46NU000001', lot_number: 'LOT-78451243',
    auction: 'IAAI', receiver_phone: '+995 599 400 100', us_state: 'NJ-TRENTON',
    destination_port: 'ფოთი', us_port: 'Newark', line: 'Maersk',
    current_status: 'arrived', vehicle_price: 14500.00, total_price: 18900.00,
    payed_amount: 18900.00, debt_amount: 0, container_number: 'MSKU-2233445',
    booking: 'BK-2025-007', dealer_fee: 350, status_color: 'green',
    buyer_number: 'BN-008', has_key: true, doc_type: 'SALVAGE', vehicle_type: 'suv',
    is_hybrid: false, is_fully_paid: true, is_partially_paid: false,
    is_funded: false, is_insured: true, is_sublot: true,
    purchase_date: '2025-01-02', vehicle_pickup_date: '2025-01-05',
    warehouse_receive_date: '2025-01-10', container_loading_date: '2025-01-14',
    estimated_receive_date: '2025-02-12', receive_date: '2025-02-14',
    container_cost: 1100, landing_cost: 700,
    driver_fullname: 'დიმიტრი სულხანიშვილი', driver_phone: '+995 599 900 400',
    driver_car_license_number: 'DD-004-DD', driver_company: 'TransGeo',
  },
  {
    buyer: 'ლევან ჯანაშია', dealer_idx: 4, receiver_fullname: 'ეკა ბერაძე',
    receiver_identity_number: '60001070009', mark: 'LEXUS', model: 'RX 350',
    year: 2021, vin: '2T2BZMCA3MC000001', lot_number: 'LOT-78451244',
    auction: 'Copart', receiver_phone: '+995 599 400 200', us_state: 'IL-CHICAGO SOUTH',
    destination_port: 'ფოთი', us_port: 'Chicago', line: 'MSC',
    current_status: 'in_transit', vehicle_price: 20000.00, total_price: 25300.00,
    payed_amount: 15000.00, debt_amount: 10300.00, container_number: 'MSCU-5566778',
    booking: 'BK-2025-008', dealer_fee: 500, status_color: 'yellow',
    buyer_number: 'BN-009', has_key: false, doc_type: 'SALVAGE', vehicle_type: 'suv',
    is_hybrid: false, is_fully_paid: false, is_partially_paid: true,
    is_funded: true, is_insured: false, is_sublot: false,
    purchase_date: '2025-02-03', vehicle_pickup_date: '2025-02-06',
    warehouse_receive_date: '2025-02-10', container_loading_date: '2025-02-14',
    estimated_receive_date: '2025-03-18', receive_date: null,
    container_cost: 1350, landing_cost: 880,
  },
  {
    buyer: 'გიორგი კაპანაძე', dealer_idx: 1, receiver_fullname: 'ბექა ლომიძე',
    receiver_identity_number: '60001070010', mark: 'CHEVROLET', model: 'Corvette C8',
    year: 2023, vin: '1G1Y72D47P5100001', lot_number: 'LOT-78451245',
    auction: 'Copart', receiver_phone: '+995 599 100 300', us_state: 'MI-DETROIT',
    destination_port: 'ფოთი', us_port: 'Detroit', line: 'MSC',
    current_status: 'booked', vehicle_price: 55000.00, total_price: 62000.00,
    payed_amount: 30000.00, debt_amount: 32000.00, container_number: null,
    booking: null, dealer_fee: 1000, status_color: 'red',
    buyer_number: 'BN-010', has_key: true, doc_type: 'CLEAN', vehicle_type: 'coupe',
    is_hybrid: false, is_fully_paid: false, is_partially_paid: true,
    is_funded: false, is_insured: false, is_sublot: false,
    purchase_date: '2025-02-08', vehicle_pickup_date: null,
    warehouse_receive_date: null, container_loading_date: null,
    estimated_receive_date: null, receive_date: null,
    container_cost: 0, landing_cost: 0,
  },
  {
    buyer: 'ნიკა ბერიძე', dealer_idx: 2, receiver_fullname: 'სანდრო ქუთათელაძე',
    receiver_identity_number: '60001070011', mark: 'VOLKSWAGEN', model: 'Golf GTI',
    year: 2022, vin: '3VWS57BU5NM000001', lot_number: 'LOT-78451246',
    auction: 'IAAI', receiver_phone: '+995 599 200 300', us_state: 'PA-PHILADELPHIA',
    destination_port: 'ბათუმი', us_port: 'Newark', line: 'Maersk',
    current_status: 'arrived', vehicle_price: 16000.00, total_price: 20500.00,
    payed_amount: 20500.00, debt_amount: 0, container_number: 'MSKU-8899001',
    booking: 'BK-2025-009', dealer_fee: 400, status_color: 'green',
    buyer_number: 'BN-011', has_key: true, doc_type: 'CLEAN', vehicle_type: 'hatchback',
    is_hybrid: false, is_fully_paid: true, is_partially_paid: false,
    is_funded: false, is_insured: true, is_sublot: false,
    purchase_date: '2025-01-12', vehicle_pickup_date: '2025-01-15',
    warehouse_receive_date: '2025-01-20', container_loading_date: '2025-01-24',
    estimated_receive_date: '2025-02-25', receive_date: '2025-02-27',
    container_cost: 1200, landing_cost: 750,
    driver_fullname: 'ოთარ ლაზარაშვილი', driver_phone: '+995 599 900 500',
    driver_car_license_number: 'EE-005-EE', driver_company: 'AutoDelivery',
  },
  {
    buyer: 'დავით მაისურაძე', dealer_idx: 3, receiver_fullname: 'ირაკლი ძიძიგური',
    receiver_identity_number: '60001070012', mark: 'KIA', model: 'Stinger GT',
    year: 2022, vin: 'KNAE55LC0N6000001', lot_number: 'LOT-78451247',
    auction: 'Copart', receiver_phone: '+995 599 300 400', us_state: 'WA-SEATTLE',
    destination_port: 'ფოთი', us_port: 'Seattle', line: 'ZIM',
    current_status: 'booked', vehicle_price: 19000.00, total_price: 24200.00,
    payed_amount: 0, debt_amount: 24200.00, container_number: null,
    booking: null, dealer_fee: 450, status_color: 'red',
    buyer_number: 'BN-012', has_key: true, doc_type: 'SALVAGE', vehicle_type: 'sedan',
    is_hybrid: false, is_fully_paid: false, is_partially_paid: false,
    is_funded: false, is_insured: false, is_sublot: false,
    purchase_date: '2025-02-11', vehicle_pickup_date: null,
    warehouse_receive_date: null, container_loading_date: null,
    estimated_receive_date: null, receive_date: null,
    container_cost: 0, landing_cost: 0,
  },
  {
    buyer: 'ლევან ჯანაშია', dealer_idx: 4, receiver_fullname: 'ნიკოლოზ ფერაძე',
    receiver_identity_number: '60001070013', mark: 'HONDA', model: 'Civic Type R',
    year: 2023, vin: 'SHHFL5H70PU000001', lot_number: 'LOT-78451248',
    auction: 'IAAI', receiver_phone: '+995 599 400 300', us_state: 'OH-COLUMBUS',
    destination_port: 'ფოთი', us_port: 'Newark', line: 'MSC',
    current_status: 'arrived', vehicle_price: 28000.00, total_price: 33800.00,
    payed_amount: 25000.00, debt_amount: 8800.00, container_number: 'MSCU-3344556',
    booking: 'BK-2025-010', dealer_fee: 550, status_color: 'green',
    buyer_number: 'BN-013', has_key: true, doc_type: 'CLEAN', vehicle_type: 'hatchback',
    is_hybrid: false, is_fully_paid: false, is_partially_paid: true,
    is_funded: false, is_insured: true, is_sublot: false,
    purchase_date: '2025-01-06', vehicle_pickup_date: '2025-01-09',
    warehouse_receive_date: '2025-01-14', container_loading_date: '2025-01-18',
    estimated_receive_date: '2025-02-16', receive_date: '2025-02-18',
    container_cost: 1200, landing_cost: 800,
    driver_fullname: 'ზურაბ გელაშვილი', driver_phone: '+995 599 900 100',
    driver_car_license_number: 'AA-001-AA', driver_company: 'TransGeo',
  },
  {
    buyer: 'გიორგი კაპანაძე', dealer_idx: 1, receiver_fullname: 'ლია კვარაცხელია',
    receiver_identity_number: '60001070014', mark: 'SUBARU', model: 'WRX STI',
    year: 2021, vin: 'JF1VA2S65L9800001', lot_number: 'LOT-78451249',
    auction: 'Copart', receiver_phone: '+995 599 100 400', us_state: 'CO-DENVER',
    destination_port: 'ფოთი', us_port: 'Denver', line: 'ZIM',
    current_status: 'in_transit', vehicle_price: 21000.00, total_price: 26400.00,
    payed_amount: 26400.00, debt_amount: 0, container_number: 'ZIMU-6677889',
    booking: 'BK-2025-011', dealer_fee: 480, status_color: 'yellow',
    buyer_number: 'BN-014', has_key: true, doc_type: 'CLEAN', vehicle_type: 'sedan',
    is_hybrid: false, is_fully_paid: true, is_partially_paid: false,
    is_funded: false, is_insured: true, is_sublot: false,
    purchase_date: '2025-01-30', vehicle_pickup_date: '2025-02-02',
    warehouse_receive_date: '2025-02-06', container_loading_date: '2025-02-10',
    estimated_receive_date: '2025-03-12', receive_date: null,
    container_cost: 1150, landing_cost: 780,
  },
  {
    buyer: 'ნიკა ბერიძე', dealer_idx: 2, receiver_fullname: 'დემეტრე წერეთელი',
    receiver_identity_number: '60001070015', mark: 'MAZDA', model: 'CX-5',
    year: 2023, vin: 'JM3KFBCM5P0000001', lot_number: 'LOT-78451250',
    auction: 'IAAI', receiver_phone: '+995 599 200 400', us_state: 'AZ-PHOENIX',
    destination_port: 'ფოთი', us_port: 'Long Beach', line: 'MSC',
    current_status: 'arrived', vehicle_price: 17500.00, total_price: 22100.00,
    payed_amount: 22100.00, debt_amount: 0, container_number: 'MSCU-9900112',
    booking: 'BK-2025-012', dealer_fee: 420, status_color: 'green',
    buyer_number: 'BN-015', has_key: true, doc_type: 'CLEAN', vehicle_type: 'suv',
    is_hybrid: false, is_fully_paid: true, is_partially_paid: false,
    is_funded: false, is_insured: true, is_sublot: false,
    purchase_date: '2025-01-03', vehicle_pickup_date: '2025-01-06',
    warehouse_receive_date: '2025-01-11', container_loading_date: '2025-01-15',
    estimated_receive_date: '2025-02-13', receive_date: '2025-02-15',
    container_cost: 1180, landing_cost: 760,
    driver_fullname: 'ლაშა ბაქრაძე', driver_phone: '+995 599 900 200',
    driver_car_license_number: 'BB-002-BB', driver_company: 'AutoDelivery',
  },
  {
    buyer: 'ლევან ჯანაშია', dealer_idx: 4, receiver_fullname: 'შოთა რუსთაველი',
    receiver_identity_number: '60001070016', mark: 'DODGE', model: 'Charger R/T',
    year: 2022, vin: '2C3CDXCT3NH000001', lot_number: 'LOT-78451251',
    auction: 'Copart', receiver_phone: '+995 599 400 400', us_state: 'TX-DALLAS',
    destination_port: 'ბათუმი', us_port: 'Houston', line: 'ZIM',
    current_status: 'in_transit', vehicle_price: 24000.00, total_price: 29500.00,
    payed_amount: 5000.00, debt_amount: 24500.00, container_number: 'ZIMU-1122334',
    booking: 'BK-2025-013', dealer_fee: 580, status_color: 'yellow',
    buyer_number: 'BN-016', has_key: false, doc_type: 'SALVAGE', vehicle_type: 'sedan',
    is_hybrid: false, is_fully_paid: false, is_partially_paid: true,
    is_funded: true, is_insured: false, is_sublot: false,
    purchase_date: '2025-02-06', vehicle_pickup_date: '2025-02-09',
    warehouse_receive_date: '2025-02-13', container_loading_date: '2025-02-17',
    estimated_receive_date: '2025-03-20', receive_date: null,
    container_cost: 1300, landing_cost: 850,
  },
];

// ====== SEED FUNCTIONS ======

async function seedUsers() {
  console.log('\nSeeding users...');
  const userIds = [];
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, surname, email, username, password_hash, balance, phone, calculator_category, role, identity_number, superviser_fee, debt, signup_date, last_login_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW()) RETURNING id`,
      [u.name, u.surname, u.email, u.username, hash, u.balance, u.phone, u.calculator_category, u.role, u.identity_number, u.superviser_fee, u.debt]
    );
    userIds.push(result.rows[0].id);
    console.log(`  Created user: ${u.username} (${u.role}) - ID: ${result.rows[0].id}`);
  }
  return userIds;
}

async function seedBoats() {
  console.log('\nSeeding boats...');
  const boatIds = [];
  for (const b of BOATS) {
    const result = await pool.query(
      `INSERT INTO boats (name, identification_code, departure_date, estimated_arrival_date, arrival_date, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [b.name, b.identification_code, b.departure_date, b.estimated_arrival_date, b.arrival_date, b.status]
    );
    boatIds.push(result.rows[0].id);
    console.log(`  Created boat: ${b.name} (${b.status}) - ID: ${result.rows[0].id}`);
  }
  return boatIds;
}

async function seedVehicles(userIds) {
  console.log('\nSeeding vehicles (with R2 image uploads)...');
  const vehicleData = [];
  for (let i = 0; i < VEHICLES.length; i++) {
    const v = VEHICLES[i];
    const dealerId = userIds[v.dealer_idx];

    // Upload image to R2
    const imageUrl = await uploadCarImage(CAR_IMAGES[i % CAR_IMAGES.length], v.lot_number, i);

    const result = await pool.query(
      `INSERT INTO vehicles (
        buyer, dealer_id, receiver_fullname, receiver_identity_number,
        mark, model, year, vin, lot_number, auction, receiver_phone,
        us_state, destination_port, us_port, is_sublot, is_fully_paid,
        is_partially_paid, is_funded, is_insured, doc_type,
        container_cost, landing_cost, vehicle_price, total_price,
        payed_amount, debt_amount, container_number, line, current_status,
        vehicle_pickup_date, warehouse_receive_date, container_loading_date,
        estimated_receive_date, receive_date, booking, dealer_fee,
        status_color, buyer_number, has_key, profile_image_url,
        has_auction_image, has_transportation_image, has_port_image,
        has_poti_image, is_hybrid, vehicle_type, container_open_date,
        container_receive_date, driver_fullname, driver_phone,
        driver_car_license_number, purchase_date, driver_company
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
        $39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53
      ) RETURNING id, vin, mark, model`,
      [
        v.buyer, dealerId, v.receiver_fullname, v.receiver_identity_number,
        v.mark, v.model, v.year, v.vin, v.lot_number, v.auction, v.receiver_phone,
        v.us_state, v.destination_port, v.us_port, v.is_sublot, v.is_fully_paid,
        v.is_partially_paid, v.is_funded, v.is_insured, v.doc_type,
        v.container_cost, v.landing_cost, v.vehicle_price, v.total_price,
        v.payed_amount, v.debt_amount, v.container_number, v.line, v.current_status,
        v.vehicle_pickup_date, v.warehouse_receive_date, v.container_loading_date,
        v.estimated_receive_date, v.receive_date, v.booking, v.dealer_fee,
        v.status_color, v.buyer_number, v.has_key, imageUrl,
        true, v.current_status !== 'booked', v.current_status === 'arrived', v.current_status === 'arrived',
        v.is_hybrid, v.vehicle_type, v.container_open_date || null,
        v.container_receive_date || null, v.driver_fullname || null, v.driver_phone || null,
        v.driver_car_license_number || null, v.purchase_date, v.driver_company || null,
      ]
    );
    vehicleData.push({ ...result.rows[0], ...v });
    console.log(`  Created vehicle: ${v.mark} ${v.model} (${v.vin})`);
  }
  return vehicleData;
}

async function seedBooking(userIds, boatIds, vehicles) {
  console.log('\nSeeding bookings...');
  // Only create bookings for vehicles that have a booking number
  const bookedVehicles = vehicles.filter(v => v.booking);
  const boatAssignment = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 3];
  const ports = ['Long Beach', 'Newark', 'Houston', 'Jacksonville', 'Savannah', 'Seattle', 'Detroit', 'Chicago'];

  for (let i = 0; i < bookedVehicles.length; i++) {
    const v = bookedVehicles[i];
    const boatIdx = boatAssignment[i % boatAssignment.length];
    const boat = BOATS[boatIdx];

    await pool.query(
      `INSERT INTO booking (
        vin, buyer_fullname, booking_number, booking_paid, container,
        container_loaded_date, container_receiver, container_receive_date,
        delivery_location, estimated_arrival_date, line, open_date,
        loading_port, terminal, lot_number, user_id, boat_id, boat_name
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        v.vin, v.receiver_fullname, v.booking, v.is_fully_paid,
        v.container_number, v.container_loading_date, v.receiver_fullname,
        v.container_receive_date || v.receive_date,
        v.destination_port, v.estimated_receive_date, v.line,
        v.container_open_date || null,
        v.us_port, `Terminal ${i + 1}`, v.lot_number,
        userIds[v.dealer_idx], boatIds[boatIdx], boat.name,
      ]
    );
    console.log(`  Created booking: ${v.booking} for ${v.vin}`);
  }
}

async function seedContainers(userIds, boatIds, vehicles) {
  console.log('\nSeeding containers...');
  // Only vehicles with container numbers
  const containered = vehicles.filter(v => v.container_number);
  const statusMap = { arrived: 'arrived', in_transit: 'in_transit', booked: 'booked' };
  const boatAssignment = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0];

  for (let i = 0; i < containered.length; i++) {
    const v = containered[i];
    const boatIdx = boatAssignment[i % boatAssignment.length];
    const boat = BOATS[boatIdx];

    await pool.query(
      `INSERT INTO containers (
        container_number, vin, purchase_date, manufacturer, model,
        manufacturer_year, buyer_name, booking, delivery_location,
        container_open_date, line, personal_number, lot_number,
        loading_port, container_loaded_date, container_receive_date,
        boat_id, boat_name, user_id, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [
        v.container_number, v.vin, v.purchase_date, v.mark, v.model,
        v.year, v.buyer, v.booking, v.destination_port,
        v.container_open_date || null, v.line, v.receiver_identity_number,
        v.lot_number, v.us_port, v.container_loading_date,
        v.container_receive_date || null,
        boatIds[boatIdx], boat.name, userIds[v.dealer_idx],
        statusMap[v.current_status] || 'booked',
      ]
    );
    console.log(`  Created container: ${v.container_number}`);
  }
}

async function seedTransactions(vehicles) {
  console.log('\nSeeding transactions...');
  const paymentTypes = ['car_amount', 'shipping', 'customs', 'balance'];
  let txCount = 0;

  for (const v of vehicles) {
    if (v.payed_amount > 0) {
      // Main vehicle payment
      await pool.query(
        `INSERT INTO transactions (payer, vin, mark, model, year, buyer, personal_number, paid_amount, payment_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [v.buyer, v.vin, v.mark, v.model, v.year, v.receiver_fullname, v.receiver_identity_number,
         v.vehicle_price, 'car_amount']
      );
      txCount++;

      // Shipping payment for arrived/in_transit
      if (v.current_status !== 'booked' && v.container_cost > 0) {
        await pool.query(
          `INSERT INTO transactions (payer, vin, mark, model, year, buyer, personal_number, paid_amount, payment_type)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [v.buyer, v.vin, v.mark, v.model, v.year, v.receiver_fullname, v.receiver_identity_number,
           v.container_cost + v.landing_cost, 'shipping']
        );
        txCount++;
      }

      // Customs for arrived vehicles
      if (v.current_status === 'arrived') {
        await pool.query(
          `INSERT INTO transactions (payer, vin, mark, model, year, buyer, personal_number, paid_amount, payment_type)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [v.buyer, v.vin, v.mark, v.model, v.year, v.receiver_fullname, v.receiver_identity_number,
           v.dealer_fee, 'customs']
        );
        txCount++;
      }
    }
  }

  // A few balance transactions
  const balanceTxs = [
    { payer: 'გიორგი კაპანაძე', amount: 5000 },
    { payer: 'ნიკა ბერიძე', amount: 3000 },
    { payer: 'ლევან ჯანაშია', amount: 2000 },
  ];
  for (const bt of balanceTxs) {
    await pool.query(
      `INSERT INTO transactions (payer, paid_amount, payment_type, "addToBalanseAmount")
       VALUES ($1,$2,$3,$4)`,
      [bt.payer, bt.amount, 'balance', bt.amount]
    );
    txCount++;
  }

  console.log(`  Created ${txCount} transactions`);
}

// ====== MAIN ======

async function seed() {
  console.log('=== Starting Demo Data Seed ===\n');

  try {
    // Clear existing data (in reverse dependency order)
    console.log('Clearing existing data...');
    await pool.query('DELETE FROM transactions');
    await pool.query('DELETE FROM containers');
    await pool.query('DELETE FROM booking');
    await pool.query('DELETE FROM vehicles');
    await pool.query('DELETE FROM boats');
    await pool.query('DELETE FROM users');
    console.log('  Cleared all tables');

    const userIds = await seedUsers();
    const boatIds = await seedBoats();
    const vehicles = await seedVehicles(userIds);
    await seedBooking(userIds, boatIds, vehicles);
    await seedContainers(userIds, boatIds, vehicles);
    await seedTransactions(vehicles);

    console.log('\n=== Seed Complete ===');
    console.log(`  Users: ${USERS.length}`);
    console.log(`  Boats: ${BOATS.length}`);
    console.log(`  Vehicles: ${VEHICLES.length}`);
    console.log(`  Login: admin/admin123 or giorgi/dealer123`);
  } catch (err) {
    console.error('\nSeed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
