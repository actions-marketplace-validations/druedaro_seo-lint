import type { Rule, RuleContext, Finding } from "../types.js";
import { querySelectorAll, getAttribute, getTextContent, getLocation, type Document } from "../parser.js";

const SCHEMA_ORG_TYPES = new Set([
  "Thing",
  "CreativeWork",
  "Article",
  "NewsArticle",
  "BlogPosting",
  "ScholarlyArticle",
  "TechArticle",
  "WebPage",
  "AboutPage",
  "CheckoutPage",
  "ContactPage",
  "CollectionPage",
  "FAQPage",
  "ItemPage",
  "MedicalWebPage",
  "ProfilePage",
  "QAPage",
  "RealEstateListing",
  "SearchResultsPage",
  "WebSite",
  "WebApplication",
  "SoftwareApplication",
  "MobileApplication",
  "Book",
  "Chapter",
  "Audiobook",
  "Movie",
  "Episode",
  "TVEpisode",
  "Season",
  "TVSeason",
  "Series",
  "TVSeries",
  "Recipe",
  "Review",
  "UserReview",
  "CriticReview",
  "EmployerReview",
  "HowTo",
  "HowToStep",
  "HowToSection",
  "HowToSupply",
  "HowToTool",
  "HowToDirection",
  "Course",
  "Dataset",
  "DataCatalog",
  "MediaObject",
  "ImageObject",
  "VideoObject",
  "AudioObject",
  "Question",
  "Answer",
  "Comment",
  "DiscussionForumPosting",
  "SocialMediaPosting",
  "Person",
  "Organization",
  "Airline",
  "Consortium",
  "Corporation",
  "EducationalOrganization",
  "CollegeOrUniversity",
  "School",
  "ElementarySchool",
  "MiddleSchool",
  "HighSchool",
  "Preschool",
  "GovernmentOrganization",
  "LocalBusiness",
  "AnimalShelter",
  "ArchiveOrganization",
  "AutomotiveBusiness",
  "ChildCare",
  "Dentist",
  "DryCleaningOrLaundry",
  "EmergencyService",
  "EmploymentAgency",
  "EntertainmentBusiness",
  "FinancialService",
  "FoodEstablishment",
  "Bakery",
  "BarOrPub",
  "Brewery",
  "CafeOrCoffeeShop",
  "FastFoodRestaurant",
  "IceCreamShop",
  "Restaurant",
  "Winery",
  "GovernmentOffice",
  "PostOffice",
  "HealthAndBeautyBusiness",
  "BeautySalon",
  "DaySpa",
  "HairSalon",
  "HealthClub",
  "NailSalon",
  "TattooParlor",
  "HomeAndConstructionBusiness",
  "Electrician",
  "GeneralContractor",
  "HVACBusiness",
  "HousePainter",
  "Locksmith",
  "Plumber",
  "RoofingContractor",
  "InternetCafe",
  "LegalService",
  "Attorney",
  "Notary",
  "Library",
  "LodgingBusiness",
  "BedAndBreakfast",
  "Campground",
  "Hostel",
  "Hotel",
  "Motel",
  "Resort",
  "MedicalBusiness",
  "CommunityHealth",
  "MedicalClinic",
  "Pharmacy",
  "Physiotherapy",
  "ProfessionalService",
  "AccountingService",
  "RadioStation",
  "RealEstateAgent",
  "RecyclingCenter",
  "SelfStorage",
  "ShoppingCenter",
  "SportsActivityLocation",
  "Store",
  "AutoPartsStore",
  "BikeStore",
  "BookStore",
  "ClothingStore",
  "ComputerStore",
  "ConvenienceStore",
  "DepartmentStore",
  "ElectronicsStore",
  "Florist",
  "FurnitureStore",
  "GardenStore",
  "GroceryStore",
  "HardwareStore",
  "HobbyShop",
  "HomeGoodsStore",
  "JewelryStore",
  "LiquorStore",
  "MensClothingStore",
  "MobilePhoneStore",
  "MovieRentalStore",
  "MusicStore",
  "OfficeEquipmentStore",
  "OutletStore",
  "PawnShop",
  "PetStore",
  "ShoeStore",
  "SportingGoodsStore",
  "TireShop",
  "ToyStore",
  "WholesaleStore",
  "TelevisionStation",
  "TouristInformationCenter",
  "TravelAgency",
  "MedicalOrganization",
  "Hospital",
  "NGO",
  "PerformingGroup",
  "SportsOrganization",
  "SportsTeam",
  "Product",
  "IndividualProduct",
  "ProductModel",
  "ProductGroup",
  "Vehicle",
  "Offer",
  "AggregateOffer",
  "OfferCatalog",
  "Demand",
  "PriceSpecification",
  "UnitPriceSpecification",
  "DeliveryChargeSpecification",
  "Brand",
  "Service",
  "FinancialProduct",
  "BankAccount",
  "CreditCard",
  "LoanOrCredit",
  "AggregateRating",
  "Rating",
  "Order",
  "OrderItem",
  "ParcelDelivery",
  "Event",
  "BusinessEvent",
  "ChildrensEvent",
  "ComedyEvent",
  "CourseInstance",
  "DanceEvent",
  "DeliveryEvent",
  "EducationEvent",
  "ExhibitionEvent",
  "Festival",
  "FoodEvent",
  "Hackathon",
  "LiteraryEvent",
  "MusicEvent",
  "PublicationEvent",
  "SaleEvent",
  "ScreeningEvent",
  "SocialEvent",
  "SportsEvent",
  "TheaterEvent",
  "VisualArtsEvent",
  "Place",
  "Accommodation",
  "Apartment",
  "House",
  "Room",
  "AdministrativeArea",
  "City",
  "Country",
  "State",
  "CivicStructure",
  "Airport",
  "Aquarium",
  "Beach",
  "Bridge",
  "BusStation",
  "BusStop",
  "Cemetery",
  "Crematorium",
  "EventVenue",
  "FireStation",
  "GovernmentBuilding",
  "CityHall",
  "Courthouse",
  "Embassy",
  "MovieTheater",
  "Museum",
  "MusicVenue",
  "Park",
  "ParkingFacility",
  "PerformingArtsTheater",
  "PlaceOfWorship",
  "Church",
  "HinduTemple",
  "Mosque",
  "Synagogue",
  "Playground",
  "PoliceStation",
  "StadiumOrArena",
  "SubwayStation",
  "TrainStation",
  "Zoo",
  "Landform",
  "BodyOfWater",
  "Continent",
  "Mountain",
  "Volcano",
  "LandmarksOrHistoricalBuildings",
  "Residence",
  "TouristAttraction",
  "TouristDestination",
  "Action",
  "SearchAction",
  "ReadAction",
  "ViewAction",
  "WatchAction",
  "ListenAction",
  "BuyAction",
  "OrderAction",
  "PayAction",
  "TrackAction",
  "BreadcrumbList",
  "ItemList",
  "ListItem",
  "SiteNavigationElement",
  "WPHeader",
  "WPFooter",
  "WPSideBar",
  "Intangible",
  "Audience",
  "ContactPoint",
  "PostalAddress",
  "GeoCoordinates",
  "GeoShape",
  "OpeningHoursSpecification",
  "PropertyValue",
  "QuantitativeValue",
  "StructuredValue",
  "MonetaryAmount",
  "JobPosting",
  "EducationalOccupationalCredential",
  "Language",
  "Occupation",
  "OccupationalExperienceRequirements",
  "EducationalOccupationalProgram",
  "Certification",
  "DefinedTerm",
  "DefinedTermSet",
  "CategoryCode",
  "CategoryCodeSet",
  "Project",
  "ResearchProject",
  "FundingAgency",
  "FundingScheme",
  "Grant",
  "MonetaryGrant",
  "ProgramMembership",
  "AlignmentObject",
  "SpeakableSpecification",
  "ComputerLanguage",
  "SoftwareSourceCode",
  "EntryPoint",
  "ActionAccessSpecification",
  "InteractionCounter",
  "BroadcastService",
  "BroadcastEvent",
  "ServiceChannel",
  "MerchantReturnPolicy",
  "ShippingDetails",
  "OfferShippingDetails",
  "DigitalDocument",
  "Note",
  "Message",
  "EmailMessage",
  "Distance",
  "Duration",
  "Energy",
  "Mass",
  "GeospatialGeometry",
  "PostalCodeRangeSpecification",
  "GovernmentService",
]);

function normalizeTypeName(rawType: string): string {
  return rawType
    .trim()
    .replace(/^https?:\/\/schema\.org\//, "");
}

function inspectEntities(val: unknown, callback: (obj: Record<string, unknown>, isTopLevel: boolean) => void, isTopLevel = true) {
  if (!val || typeof val !== "object") return;

  if (Array.isArray(val)) {
    for (const item of val) {
      inspectEntities(item, callback, true);
    }
    return;
  }

  const obj = val as Record<string, unknown>;

  if (Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      inspectEntities(item, callback, true);
    }
    return;
  }

  callback(obj, isTopLevel);

  for (const [key, v] of Object.entries(obj)) {
    if (key === "@graph" || key === "@context") continue;
    if (typeof v === "object" && v !== null) {
      inspectEntities(v, callback, false);
    }
  }
}

export const jsonldValidType: Rule = {
  meta: {
    id: "jsonld-valid-type",
    severity: "error",
    category: "structured-data",
    description: "JSON-LD entities must have a valid @type matching the Schema.org vocabulary.",
    docsUrl: "https://schema.org/docs/full.html",
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const scripts = querySelectorAll(doc, "script");

    const jsonLdScripts = scripts.filter((el) => {
      const type = getAttribute(el, "type");
      return type?.trim().toLowerCase() === "application/ld+json";
    });

    for (const script of jsonLdScripts) {
      const loc = getLocation(script);
      const text = getTextContent(script).trim();
      if (text.length === 0) continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        continue;
      }

      inspectEntities(parsed, (obj, isTopLevel) => {
        const rawType = obj["@type"];

        if (rawType === undefined) {
          if (isTopLevel) {
            findings.push({
              ruleId: "jsonld-valid-type",
              severity: jsonldValidType.meta.severity,
              category: jsonldValidType.meta.category,
              message: 'Top-level JSON-LD entity is missing a "@type" property.',
              filePath: ctx.filePath,
              ...loc,
            });
          }
          return;
        }

        const typesToCheck: string[] = [];

        if (typeof rawType === "string") {
          typesToCheck.push(rawType);
        } else if (Array.isArray(rawType)) {
          for (const t of rawType) {
            if (typeof t === "string") {
              typesToCheck.push(t);
            } else {
              findings.push({
                ruleId: "jsonld-valid-type",
                severity: jsonldValidType.meta.severity,
                category: jsonldValidType.meta.category,
                message: 'Invalid "@type" element: each item in @type array must be a string.',
                filePath: ctx.filePath,
                ...loc,
              });
            }
          }
        } else {
          findings.push({
            ruleId: "jsonld-valid-type",
            severity: jsonldValidType.meta.severity,
            category: jsonldValidType.meta.category,
            message: 'Invalid "@type" property: must be a string or array of strings.',
            filePath: ctx.filePath,
            ...loc,
          });
          return;
        }

        for (const type of typesToCheck) {
          const normalized = normalizeTypeName(type);
          if (!SCHEMA_ORG_TYPES.has(normalized)) {
            findings.push({
              ruleId: "jsonld-valid-type",
              severity: jsonldValidType.meta.severity,
              category: jsonldValidType.meta.category,
              message: `Unknown Schema.org @type "${type}". Check spelling or Schema.org vocabulary.`,
              filePath: ctx.filePath,
              ...loc,
            });
          }
        }
      });
    }

    return findings;
  },
};
