// used ai to get data 

var skatingLocations = [
    // Ice Skating Locations
    {
        id: 1,
        name: "Harbourfront Centre Rink",
        type: "ice",
        area: "downtown",
        surface: "outdoor",
        address: "235 Queens Quay W, Toronto, ON M5J 2G8",
        coordinates: { lat: 43.6389, lng: -79.3814 },
        status: "open",
        amenities: ["rentals", "washrooms", "food"],
        openingHours: {
            monday: "10:00 AM - 10:00 PM",
            tuesday: "10:00 AM - 10:00 PM",
            wednesday: "10:00 AM - 10:00 PM",
            thursday: "10:00 AM - 10:00 PM",
            friday: "10:00 AM - 11:00 PM",
            saturday: "10:00 AM - 11:00 PM",
            sunday: "10:00 AM - 10:00 PM",
            weekdays: "10:00 AM - 10:00 PM",
            weekends: "10:00 AM - 11:00 PM"
        },
        rentals: {
            available: true,
            items: ["Ice Skates", "Helmets"],
            prices: {
                skates: "$12",
                helmets: "$5"
            }
        },
        entryFee: "Free",
        imageUrl: "images/harbourfront.jpg",
        description: "Scenic outdoor rink overlooking Lake Ontario with beautiful waterfront views. The Harbourfront Centre Rink offers family-friendly skating in the heart of downtown Toronto, perfect for romantic evenings and daytime skating adventures.",
        weather: "-2°C, light snow",
        specialEvents: "Friday Night Skate with DJ (8PM-11PM)",
        proTips: [
            "Most scenic during sunset hours",
            "Hot chocolate from the Lake View Café is a must-try",
            "Less crowded on weekday mornings",
            "Bring your own skates to avoid rental lines"
        ]
    },
    {
        id: 2,
        name: "Nathan Phillips Square",
        type: "ice",
        area: "downtown",
        surface: "outdoor",
        address: "100 Queen St W, Toronto, ON M5H 2N2",
        coordinates: { lat: 43.6524, lng: -79.3834 },
        status: "open",
        amenities: ["rentals", "washrooms", "food", "parking"],
        openingHours: {
            monday: "9:00 AM - 10:00 PM",
            tuesday: "9:00 AM - 10:00 PM",
            wednesday: "9:00 AM - 10:00 PM",
            thursday: "9:00 AM - 10:00 PM",
            friday: "9:00 AM - 10:00 PM",
            saturday: "10:00 AM - 11:00 PM",
            sunday: "10:00 AM - 10:00 PM",
            weekdays: "9:00 AM - 10:00 PM",
            weekends: "10:00 AM - 11:00 PM"
        },
        rentals: {
            available: true,
            items: ["Ice Skates", "Helmets"],
            prices: {
                skates: "$10",
                helmets: "$5"
            }
        },
        entryFee: "Free",
        imageUrl: "images/nathan-phillips.jpg",
        description: "Iconic outdoor skating rink in front of Toronto City Hall. The rink features the famous TORONTO sign backdrop, offering a quintessential Toronto winter experience with a festive atmosphere.",
        weather: "-3°C, clear skies",
        specialEvents: "Holiday Light Show (Daily, 6PM-10PM)",
        proTips: [
            "Take photos with the TORONTO sign in the background",
            "Underground parking available at City Hall",
            "Busiest on weekends and holiday evenings",
            "Visit during weekday afternoons for less crowded experience"
        ]
    },
    {
        id: 3,
        name: "The Bentway Skate Trail",
        type: "ice",
        area: "downtown",
        surface: "outdoor",
        address: "250 Fort York Blvd, Toronto, ON M5V 3K9",
        coordinates: { lat: 43.6392, lng: -79.4003 },
        status: "open",
        amenities: ["rentals", "washrooms", "food"],
        openingHours: {
            monday: "5:00 PM - 9:00 PM",
            tuesday: "5:00 PM - 9:00 PM",
            wednesday: "5:00 PM - 9:00 PM",
            thursday: "5:00 PM - 9:00 PM",
            friday: "5:00 PM - 10:00 PM",
            saturday: "12:00 PM - 10:00 PM",
            sunday: "12:00 PM - 9:00 PM",
            weekdays: "5:00 PM - 9:00 PM",
            weekends: "12:00 PM - 10:00 PM"
        },
        rentals: {
            available: true,
            items: ["Ice Skates", "Helmets", "Skating Aids"],
            prices: {
                skates: "$15",
                helmets: "$5",
                aids: "$8"
            }
        },
        entryFee: "Free",
        imageUrl: "images/bentway.jpg",
        description: "Glide beneath Toronto's Gardiner Expressway at The Bentway Skate Trail, a unique 220-metre figure-eight ice path. Known for its urban vibe and lively atmosphere, this trail offers a one-of-a-kind winter skating experience.",
        weather: "-1°C, clear skies",
        specialEvents: "DJ skate nights on Fridays",
        proTips: [
            "Weekends: Arrive early to avoid long rental lines",
            "Hot Beverages: Grab a hot chocolate from the on-site vendor",
            "Summer Use: Transforms into a roller trail in warmer months",
            "Great for night skating with artistic lighting installations"
        ]
    },
    {
        id: 4,
        name: "Colonel Sam Smith Skating Trail",
        type: "ice",
        area: "etobicoke",
        surface: "outdoor",
        address: "3145 Lake Shore Blvd W, Etobicoke, ON M8V 4B6",
        coordinates: { lat: 43.5964, lng: -79.5128 },
        status: "open",
        amenities: ["washrooms", "parking"],
        openingHours: {
            monday: "9:00 AM - 10:00 PM",
            tuesday: "9:00 AM - 10:00 PM",
            wednesday: "9:00 AM - 10:00 PM",
            thursday: "9:00 AM - 10:00 PM",
            friday: "9:00 AM - 10:00 PM",
            saturday: "9:00 AM - 10:00 PM",
            sunday: "9:00 AM - 10:00 PM",
            weekdays: "9:00 AM - 10:00 PM",
            weekends: "9:00 AM - 10:00 PM"
        },
        rentals: {
            available: false
        },
        entryFee: "Free",
        imageUrl: "images/colonel-smith.jpg",
        description: "This figure-eight shaped skating trail offers a unique experience with its natural setting in Etobicoke. Perfect for recreational skaters looking for a longer path rather than a traditional rink.",
        weather: "-4°C, light snow",
        specialEvents: "Morning Skate Club (Saturdays, 8AM-9AM)",
        proTips: [
            "Bring your own skates (no rentals available)",
            "Plenty of free parking available",
            "Beautiful lakeside views",
            "Great for endurance skating with its 250m loop"
        ]
    },
    {
        id: 5,
        name: "North York Civic Centre Rink",
        type: "ice",
        area: "north-york",
        surface: "outdoor",
        address: "5100 Yonge St, North York, ON M2N 5V7",
        coordinates: { lat: 43.7689, lng: -79.4138 },
        status: "closed",
        amenities: ["washrooms", "parking"],
        openingHours: {
            monday: "Closed for season",
            tuesday: "Closed for season",
            wednesday: "Closed for season",
            thursday: "Closed for season",
            friday: "Closed for season",
            saturday: "Closed for season",
            sunday: "Closed for season",
            weekdays: "Closed for season",
            weekends: "Closed for season"
        },
        rentals: {
            available: false
        },
        entryFee: "Free",
        imageUrl: "images/north-york-civic.jpg",
        description: "A community favorite in North York, this outdoor rink is currently closed for the season. Will reopen in winter 2025 with improved facilities.",
        weather: "N/A - Closed",
        specialEvents: "Grand Reopening Event (November 2025)",
        proTips: [
            "Check website for reopening announcements",
            "Will feature new lighting system next season",
            "Convenient TTC access from North York Centre station",
            "Family-friendly with gentle slopes for beginners"
        ]
    },
    {
        id: 6,
        name: "Greenwood Park Ice Rink",
        type: "ice",
        area: "midtown",
        surface: "outdoor",
        address: "150 Greenwood Ave, Toronto, ON M4L 2R2",
        coordinates: { lat: 43.6729, lng: -79.3292 },
        status: "maintenance",
        amenities: ["washrooms", "parking"],
        openingHours: {
            monday: "Closed for maintenance",
            tuesday: "Closed for maintenance",
            wednesday: "Closed for maintenance",
            thursday: "12:00 PM - 10:00 PM",
            friday: "12:00 PM - 10:00 PM",
            saturday: "9:00 AM - 10:00 PM",
            sunday: "9:00 AM - 10:00 PM",
            weekdays: "Varies - See daily schedule",
            weekends: "9:00 AM - 10:00 PM"
        },
        rentals: {
            available: false
        },
        entryFee: "Free",
        imageUrl: "images/greenwood.jpg",
        description: "Toronto's first covered outdoor artificial ice rink. Currently undergoing maintenance until Thursday. Features both a hockey rink and a leisure skating trail.",
        weather: "N/A - Under maintenance",
        specialEvents: "Reopening celebration (Thursday, 12PM)",
        proTips: [
            "Maintenance scheduled to end Wednesday evening",
            "Thursday afternoon will be freshly resurfaced ice",
            "Great for families with both hockey and leisure sections",
            "Covered roof provides protection from snow while maintaining outdoor feel"
        ]
    },
    {
        id: 7,
        name: "Scarborough Civic Centre Rink",
        type: "ice",
        area: "scarborough",
        surface: "indoor",
        address: "150 Borough Dr, Scarborough, ON M1P 4N7",
        coordinates: { lat: 43.7751, lng: -79.2577 },
        status: "open",
        amenities: ["rentals", "washrooms", "food", "parking"],
        openingHours: {
            monday: "12:00 PM - 8:00 PM",
            tuesday: "12:00 PM - 8:00 PM",
            wednesday: "12:00 PM - 8:00 PM",
            thursday: "12:00 PM - 8:00 PM",
            friday: "12:00 PM - 9:00 PM",
            saturday: "10:00 AM - 9:00 PM",
            sunday: "10:00 AM - 8:00 PM",
            weekdays: "12:00 PM - 8:00 PM",
            weekends: "10:00 AM - 9:00 PM"
        },
        rentals: {
            available: true,
            items: ["Ice Skates", "Helmets", "Skating Aids"],
            prices: {
                skates: "$8",
                helmets: "$4",
                aids: "$5"
            }
        },
        entryFee: "$5 (Free for children under 12)",
        imageUrl: "images/scarborough-civic.jpg",
        description: "Indoor skating facility with climate-controlled environment. Perfect for beginners with trained staff offering basic skating lessons on weekends.",
        weather: "Indoor facility - 15°C",
        specialEvents: "Learn to Skate Workshop (Saturdays, 11AM-12PM)",
        proTips: [
            "Half-price Tuesdays for all ages",
            "Less crowded during weekday afternoons",
            "On-site café offers healthy snack options",
            "Skate sharpening services available ($10)"
        ]
    },
    
    // Roller Skating Locations
    {
        id: 8,
        name: "Scooter's Roller Palace",
        type: "roller",
        area: "midtown",
        surface: "indoor",
        address: "2105 Royal Windsor Dr, Mississauga, ON L5J 1K5",
        coordinates: { lat: 43.5121, lng: -79.6261 },
        status: "open",
        amenities: ["rentals", "washrooms", "parking", "food"],
        openingHours: {
            monday: "Closed",
            tuesday: "Closed",
            wednesday: "4:00 PM - 9:00 PM",
            thursday: "4:00 PM - 9:00 PM",
            friday: "4:00 PM - 11:00 PM",
            saturday: "1:00 PM - 11:00 PM",
            sunday: "1:00 PM - 8:00 PM",
            weekdays: "4:00 PM - 9:00 PM (Wed-Thu)",
            weekends: "Fri: 4:00 PM - 11:00 PM, Sat: 1:00 PM - 11:00 PM, Sun: 1:00 PM - 8:00 PM"
        },
        rentals: {
            available: true,
            items: ["Roller Skates", "Inline Skates", "Protective Gear"],
            prices: {
                rollerskates: "$15",
                inlineskates: "$18",
                protectivegear: "$8"
            }
        },
        entryFee: "$12",
        imageUrl: "images/rollerskating.jpg",
        description: "Classic roller rink with disco lights and weekend DJ. Features a smooth maple hardwood floor and state-of-the-art sound system for the ultimate roller disco experience.",
        weather: "Indoor facility - 22°C",
        specialEvents: "Disco Night (Fridays, 8PM-11PM)",
        proTips: [
            "Adults-only night every second Thursday",
            "Special beginner's hour on Sundays 1PM-2PM",
            "Book birthday parties online for discounts",
            "Friday nights feature live DJs and light shows"
        ]
    },
    {
        id: 9,
        name: "Roll Roll Skating Centre",
        type: "roller",
        area: "scarborough",
        surface: "indoor",
        address: "123 Skate Ave, Scarborough, ON M1K 3P6",
        coordinates: { lat: 43.7764, lng: -79.2318 },
        status: "maintenance",
        amenities: ["rentals", "washrooms", "parking"],
        openingHours: {
            monday: "Closed for maintenance",
            tuesday: "Closed for maintenance",
            wednesday: "Closed for maintenance",
            thursday: "Closed for maintenance",
            friday: "Closed for maintenance",
            saturday: "Closed for maintenance",
            sunday: "Closed for maintenance",
            weekdays: "Closed for maintenance",
            weekends: "Closed for maintenance"
        },
        rentals: {
            available: true,
            items: ["Roller Skates", "Protective Gear"],
            prices: {
                rollerskates: "$12",
                protectivegear: "$8"
            }
        },
        entryFee: "$15",
        imageUrl: "images/rollerskating2.jpg",
        description: "Currently closed for floor resurfacing. Reopening next month with a brand new polished concrete floor, perfect for smooth rolling and advanced maneuvers.",
        weather: "Indoor facility - Closed",
        specialEvents: "Grand Reopening Party (May 15, 2025)",
        proTips: [
            "Follow social media for reopening updates",
            "Sign up for early-bird reopening discount",
            "New LED lighting system being installed during closure",
            "Membership deals available during pre-opening week"
        ]
    },
    {
        id: 10,
        name: "West End Wheels",
        type: "roller",
        area: "etobicoke",
        surface: "indoor",
        address: "500 Rexdale Blvd, Etobicoke, ON M9W 6K5",
        coordinates: { lat: 43.7106, lng: -79.5944 },
        status: "open",
        amenities: ["rentals", "washrooms", "parking", "food"],
        openingHours: {
            monday: "Closed",
            tuesday: "3:00 PM - 8:00 PM",
            wednesday: "3:00 PM - 8:00 PM",
            thursday: "3:00 PM - 8:00 PM",
            friday: "3:00 PM - 10:00 PM",
            saturday: "12:00 PM - 10:00 PM",
            sunday: "12:00 PM - 7:00 PM",
            weekdays: "3:00 PM - 8:00 PM (Tue-Thu), 3:00 PM - 10:00 PM (Fri)",
            weekends: "12:00 PM - 10:00 PM (Sat), 12:00 PM - 7:00 PM (Sun)"
        },
        rentals: {
            available: true,
            items: ["Roller Skates", "Inline Skates", "Protective Gear"],
            prices: {
                rollerskates: "$14",
                inlineskates: "$16",
                protectivegear: "$10"
            }
        },
        entryFee: "$13 (Students: $10)",
        imageUrl: "images/west-end-wheels.jpg",
        description: "Family-friendly roller rink with separate areas for beginners and advanced skaters. Features bumper rails for beginners and ramps for advanced skaters.",
        weather: "Indoor facility - 21°C",
        specialEvents: "Student Night (Thursdays - $5 entry with valid ID)",
        proTips: [
            "Tuesday afternoon has the smallest crowds",
            "Birthday package includes private instruction",
            "Skill-based sessions divide floor by experience level",
            "Monthly membership offers unlimited skating"
        ]
    },
    {
        id: 11,
        name: "Urban Roller Park",
        type: "roller",
        area: "downtown",
        surface: "indoor",
        address: "401 Richmond St W, Toronto, ON M5V 3A8",
        coordinates: { lat: 43.6478, lng: -79.3959 },
        status: "open",
        amenities: ["rentals", "washrooms", "food"],
        openingHours: {
            monday: "5:00 PM - 10:00 PM",
            tuesday: "5:00 PM - 10:00 PM",
            wednesday: "5:00 PM - 10:00 PM",
            thursday: "5:00 PM - 10:00 PM",
            friday: "5:00 PM - 12:00 AM",
            saturday: "2:00 PM - 12:00 AM",
            sunday: "2:00 PM - 9:00 PM",
            weekdays: "5:00 PM - 10:00 PM (Mon-Thu), 5:00 PM - 12:00 AM (Fri)",
            weekends: "2:00 PM - 12:00 AM (Sat), 2:00 PM - 9:00 PM (Sun)"
        },
        rentals: {
            available: true,
            items: ["Premium Quad Skates", "Inline Skates", "Full Protection Set"],
            prices: {
                quadskates: "$20",
                inlineskates: "$20",
                protectionset: "$15"
            }
        },
        entryFee: "$18",
        imageUrl: "images/urban-roller.jpg",
        description: "Trendy downtown roller rink with artistic vibes. Features smooth polished concrete floors, art installations, and a cafe serving craft beverages. Popular with the young professional crowd.",
        weather: "Indoor facility - 20°C",
        specialEvents: "Roller Dance Night (Wednesdays, 8PM-10PM)",
        proTips: [
            "Reserve skates online to skip the line",
            "Monday night beginners' workshops available",
            "Instagram-worthy neon photo wall",
            "Local artists featured in monthly rotating exhibits"
        ]
    },
    {
        id: 12,
        name: "North York Roll Arena",
        type: "roller",
        area: "north-york",
        surface: "indoor",
        address: "5000 Yonge St, North York, ON M2N 7E9",
        coordinates: { lat: 43.7615, lng: -79.4115 },
        status: "open",
        amenities: ["rentals", "washrooms", "parking", "food"],
        openingHours: {
            monday: "Closed",
            tuesday: "4:00 PM - 9:00 PM",
            wednesday: "4:00 PM - 9:00 PM",
            thursday: "4:00 PM - 9:00 PM",
            friday: "4:00 PM - 11:00 PM",
            saturday: "10:00 AM - 11:00 PM",
            sunday: "10:00 AM - 8:00 PM",
            weekdays: "4:00 PM - 9:00 PM (Tue-Thu), 4:00 PM - 11:00 PM (Fri)",
            weekends: "10:00 AM - 11:00 PM (Sat), 10:00 AM - 8:00 PM (Sun)"
        },
        rentals: {
            available: true,
            items: ["Roller Skates", "Inline Skates", "Protective Gear", "Light-up Wheels"],
            prices: {
                rollerskates: "$12",
                inlineskates: "$15",
                protectivegear: "$8",
                lightupwheels: "$5 additional"
            }
        },
        entryFee: "$14 (Family package: $45 for 4)",
        imageUrl: "images/north-york-roll.jpg",
        description: "Large, modern roller arena with specialized sport court flooring. Features separate areas for free skating and skill development. Popular for family outings with children's learn-to-skate programs.",
        specialEvents: "Family Skate Sunday Mornings (10AM-12PM)",
        proTips: [
            "Kids under 8 skate free on Saturday mornings",
            "Parking validated with admission",
            "Membership includes skate rentals",
            "Quietest times are weekday afternoons"
        ]
    },
    {
        id: 13,
        name: "Riverdale Roller Path",
        type: "roller",
        area: "midtown",
        surface: "outdoor",
        address: "550 Broadview Ave, Toronto, ON M4K 2N1",
        coordinates: { lat: 43.6793, lng: -79.3525 },
        status: "open",
        amenities: ["washrooms", "food"],
        openingHours: {
            monday: "Sunrise to Sunset",
            tuesday: "Sunrise to Sunset",
            wednesday: "Sunrise to Sunset",
            thursday: "Sunrise to Sunset",
            friday: "Sunrise to Sunset",
            saturday: "Sunrise to Sunset",
            sunday: "Sunrise to Sunset",
            weekdays: "Sunrise to Sunset",
            weekends: "Sunrise to Sunset"
        },
        rentals: {
            available: false
        },
        entryFee: "Free",
        imageUrl: "images/riverdale-roller.jpg",
        description: "Smooth paved path winding through Riverdale Park with beautiful city views. Perfect for roller skating and blading with gentle slopes and wide paths for skaters of all levels.",
        specialEvents: "Thursday Evening Roller Group (6PM-8PM)",
        proTips: [
            "Best city skyline views at sunset",
            "Seasonal food vendors during summer months",
            "Benches available for rest stops",
            "Some hills may be challenging for beginners"
        ]
    },
    {
        id: 14,
        name: "Waterfront Roller Trail",
        type: "roller",
        area: "downtown",
        surface: "outdoor",
        address: "Queens Quay W, Toronto, ON M5J 2G8",
        coordinates: { lat: 43.6372, lng: -79.3962 },
        status: "open",
        amenities: ["washrooms", "food"],
        openingHours: {
            monday: "24 hours",
            tuesday: "24 hours",
            wednesday: "24 hours",
            thursday: "24 hours",
            friday: "24 hours",
            saturday: "24 hours",
            sunday: "24 hours",
            weekdays: "24 hours",
            weekends: "24 hours"
        },
        rentals: {
            available: true,
            items: ["Roller Skates", "Inline Skates", "Protective Gear"],
            prices: {
                rollerskates: "$15/hour",
                inlineskates: "$15/hour",
                protectivegear: "$5/hour"
            },
            location: "Rental kiosk at HTO Park (weekends only, 10AM-6PM)"
        },
        entryFee: "Free",
        imageUrl: "images/waterfront-trail.jpg",
        description: "Beautiful paved trail along Lake Ontario perfect for roller skating. The smooth, wide pathways offer stunning lake views and connect multiple waterfront attractions.",
        specialEvents: "Sunset Group Skate (Fridays from HTO Park, 7PM)",
        proTips: [
            "Weekend rentals available near HTO Park",
            "Less crowded on weekday mornings",
            "Watch for cyclists in shared path areas",
            "Several cafés and rest stops along the route"
        ]
    }
];