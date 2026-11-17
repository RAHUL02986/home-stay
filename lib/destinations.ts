export const destinations = [
  {
    slug: 'mcleodganj',
    name: 'McLeodganj',
    description:
      'Stay near Dharamshala’s lively cafes, monasteries, local markets, and scenic walking trails.',
  },
  {
    slug: 'dharamkot',
    name: 'Dharamkot',
    description:
      'Find a quieter mountain base known for peaceful mornings, yoga retreats, and walking trails.',
  },
  {
    slug: 'naddi',
    name: 'Naddi',
    description:
      'Explore stays in a serene hillside area with open views across the Kangra Valley and surrounding mountains.',
  },
  {
    slug: 'bhagsu',
    name: 'Bhagsu',
    description:
      'Browse stays near Bhagsu waterfall, cafes, and the lively lanes above McLeodganj.',
  },
  {
    slug: 'dharamshala-town',
    name: 'Dharamshala Town',
    description:
      'Choose a convenient base near local markets, transport links, and everyday services in Dharamshala.',
  },
] as const;

export function getDestination(slug: string) {
  return destinations.find((destination) => destination.slug === slug);
}
