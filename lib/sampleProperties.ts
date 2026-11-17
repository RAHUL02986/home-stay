import User from '@/models/User';
import Property, { type PropertyType } from '@/models/Property';
import Room from '@/models/Room';

type SampleRoom = {
  type: string;
  pricePerNight: number;
  maxGuests: number;
  availability: 'available' | 'unavailable';
  features: string[];
  totalRooms: number;
};

type SampleProperty = {
  name: string;
  description: string;
  propertyType: PropertyType;
  area: string;
  address: string;
  coordinates: { lat: number; lng: number };
  amenities: string[];
  images: string[];
  rooms: SampleRoom[];
};

const SAMPLE_PROPERTIES: SampleProperty[] = [
  {
    name: 'Mountain View Homestay',
    description:
      'A warm, family-run homestay with a balcony facing snow-capped peaks, cosy rooms, and a quiet garden perfect for early morning tea.',
    propertyType: 'homestay',
    area: 'McLeodganj',
    address: 'Near Bhagsunag Road, McLeodganj, Dharamshala',
    coordinates: { lat: 32.2438, lng: 76.3234 },
    amenities: ['Wi-Fi', 'Mountain View', 'Parking', 'Kitchen'],
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    ],
    rooms: [
      { type: 'Deluxe Room', pricePerNight: 2500, maxGuests: 2, availability: 'available', features: ['Balcony', 'Hot Water', 'Mountain View'], totalRooms: 2 },
      { type: 'Family Suite', pricePerNight: 3400, maxGuests: 4, availability: 'available', features: ['Kitchenette', 'Extra Bedding', 'Private Sit-out'], totalRooms: 1 },
    ],
  },
  {
    name: 'Himalayan Retreat Hotel',
    description:
      'An elevated boutique stay with panoramic views, modern interiors, and a restful atmosphere designed for couples and weekend escapes.',
    propertyType: 'hotel',
    area: 'Dharamkot',
    address: 'Upper Dharamkot, Near Yoga Centre Road, Dharamshala',
    coordinates: { lat: 32.2134, lng: 76.3201 },
    amenities: ['Wi-Fi', 'Mountain View', 'Kitchen', 'Parking', 'Hot Water'],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    ],
    rooms: [
      { type: 'Standard Double', pricePerNight: 4200, maxGuests: 2, availability: 'available', features: ['Queen Bed', 'Breakfast', 'Balcony'], totalRooms: 3 },
      { type: 'Executive Suite', pricePerNight: 5600, maxGuests: 3, availability: 'available', features: ['Spa Access', 'Lounge', 'City View'], totalRooms: 2 },
    ],
  },
  {
    name: 'Naddi Valley Cottage',
    description:
      'A quiet mountain cottage nestled close to valley views, ideal for slow mornings, stargazing, and easy access to scenic trails.',
    propertyType: 'villa',
    area: 'Naddi',
    address: 'Naddi Road, Naddi, Dharamshala',
    coordinates: { lat: 32.2604, lng: 76.3479 },
    amenities: ['Wi-Fi', 'Pet-friendly', 'Mountain View', 'Parking'],
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80',
    ],
    rooms: [
      { type: 'Cottage Room', pricePerNight: 1800, maxGuests: 2, availability: 'available', features: ['Front Lawn', 'Pet Friendly', 'Sunrise View'], totalRooms: 2 },
      { type: 'Garden Studio', pricePerNight: 2300, maxGuests: 2, availability: 'available', features: ['Private Patio', 'Coffee Corner', 'Hot Water'], totalRooms: 1 },
    ],
  },
  {
    name: 'Bhagsu Guest House',
    description:
      'A budget-friendly yet comfortable guest house close to waterfalls and cafés, with friendly hosts and a relaxed mountain vibe.',
    propertyType: 'guesthouse',
    area: 'Bhagsu',
    address: 'Bhagsu Nag Road, Bhagsu, Dharamshala',
    coordinates: { lat: 32.2408, lng: 76.3226 },
    amenities: ['Wi-Fi', 'Parking', 'Kitchen', 'Hot Water'],
    images: [
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    ],
    rooms: [
      { type: 'Single Room', pricePerNight: 1500, maxGuests: 1, availability: 'available', features: ['Shared Kitchen', 'Common Lounge', 'Fast Wi-Fi'], totalRooms: 3 },
      { type: 'Double Room', pricePerNight: 2200, maxGuests: 2, availability: 'available', features: ['Attached Bath', 'Work Desk', 'Window View'], totalRooms: 2 },
    ],
  },
  {
    name: 'Pine Crest Lodge',
    description:
      'A modern lodge with a pine-lined setting, warm interiors, and easy access to local cafés, treks, and viewpoints.',
    propertyType: 'hotel',
    area: 'McLeodganj',
    address: 'Near Main Square, McLeodganj, Dharamshala',
    coordinates: { lat: 32.2471, lng: 76.3255 },
    amenities: ['Wi-Fi', 'Mountain View', 'Parking', 'Hot Water'],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    ],
    rooms: [
      { type: 'Studio Room', pricePerNight: 3100, maxGuests: 2, availability: 'available', features: ['Queen Bed', 'Sky Light', 'Tea Setup'], totalRooms: 2 },
      { type: 'Family Room', pricePerNight: 4100, maxGuests: 4, availability: 'available', features: ['Two Beds', 'Living Area', 'Mountain View'], totalRooms: 1 },
    ],
  },
  {
    name: 'Dharamshala Heights',
    description:
      'A premium stay featuring spacious rooms, a rooftop deck, and a peaceful ambiance built for relaxed travellers and families.',
    propertyType: 'resort',
    area: 'Dharamshala Town',
    address: 'Dharamshala Town, Near Bus Stand, Dharamshala',
    coordinates: { lat: 32.2192, lng: 76.3218 },
    amenities: ['Wi-Fi', 'Mountain View', 'Parking', 'Kitchen', 'Hot Water'],
    images: [
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80',
    ],
    rooms: [
      { type: 'Premium Room', pricePerNight: 3500, maxGuests: 2, availability: 'available', features: ['Rooftop Seating', 'Work Desk', 'Full Kitchen'], totalRooms: 3 },
      { type: 'Family Villa', pricePerNight: 5100, maxGuests: 5, availability: 'available', features: ['Private Patio', 'Lounge', 'Breakfast Included'], totalRooms: 1 },
    ],
  },
];

export async function ensureSampleProperties() {
  const propertyCount = await Property.countDocuments({});
  if (propertyCount > 0) {
    return;
  }

  const host = await User.findOneAndUpdate(
    { email: 'host@findyourhomestay.com' },
    {
      name: 'Find Your Homestay Host',
      email: 'host@findyourhomestay.com',
      passwordHash: 'demo-host-password-hash',
      role: 'host',
      isVerified: true,
      phone: '+91 98765 43210',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  for (const sample of SAMPLE_PROPERTIES) {
    const propertyDoc = await Property.create({
      host: host._id,
      name: sample.name,
      description: sample.description,
      propertyType: sample.propertyType,
      status: 'approved',
      area: sample.area,
      address: sample.address,
      coordinates: sample.coordinates,
      amenities: sample.amenities,
      images: sample.images,
      checkInTime: '14:00',
      checkOutTime: '10:00',
      houseRules: ['No smoking indoors', 'Quiet hours after 10 PM'],
      cancellationPolicy: 'moderate',
      commissionRate: 10,
      verificationBadge: true,
      totalRooms: sample.rooms.length,
    });

    await Room.insertMany(
      sample.rooms.map((room) => ({
        property: propertyDoc._id,
        type: room.type,
        pricePerNight: room.pricePerNight,
        maxGuests: room.maxGuests,
        availability: room.availability,
        features: room.features,
        images: sample.images,
        totalRooms: room.totalRooms,
        extraGuestCharge: 0,
        blockedDates: [],
        seasonalPricing: [],
        minStay: 1,
        maxStay: 7,
        advanceBookingDays: 2,
      }))
    );
  }
}
