// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN QA CHECKLIST DEFINITIONS
// Each launch type maps to a set of sections, each section has items.
// Sections and items are shown/hidden based on launch type.
// ─────────────────────────────────────────────────────────────────────────────

export type LaunchType =
  | "campaign_launch"
  | "creative_launch"
  | "platform_launch"
  | "budget_change"
  | "flight_extension";

export type Platform =
  | "meta"
  | "google"
  | "dv360"
  | "yahoo"
  | "tiktok"
  | "pinterest"
  | "snapchat"
  | "other";

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  /** If true, this item repeats per ad set group */
  perAdSetGroup?: boolean;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
  /** Which launch types include this section */
  launchTypes: LaunchType[];
  /** Optional: only show for specific platforms */
  platforms?: Platform[];
}

// ─── SECTION DEFINITIONS ─────────────────────────────────────────────────────

export const CHECKLIST_SECTIONS: ChecklistSection[] = [
  // ── PLANNING ──────────────────────────────────────────────────────────────
  {
    id: "planning",
    title: "PLANNING",
    launchTypes: ["campaign_launch", "creative_launch", "platform_launch", "budget_change", "flight_extension"],
    items: [
      {
        id: "media_plan_approved",
        label: "Media Plan Submitted / Approved",
        description: "Confirmed working out of media plan labeled 'current' that has been approved by client",
      },
      {
        id: "ad_account_access",
        label: "Ad Account Access",
        description: "Ad account made and access granted",
      },
      {
        id: "ios_opened",
        label: "IOs Opened",
        description: "Insertion orders processed",
      },
    ],
  },

  // ── CAMPAIGN SETUP ────────────────────────────────────────────────────────
  {
    id: "campaign_setup",
    title: "CAMPAIGN SETUP",
    launchTypes: ["campaign_launch", "platform_launch"],
    items: [
      {
        id: "campaign_status_paused",
        label: "Campaign Status — Paused",
        description: "Campaign status is paused during building",
      },
      {
        id: "campaign_naming",
        label: "Campaign Naming Convention",
        description: "Campaign naming is created per naming convention",
      },
      {
        id: "campaign_objective",
        label: "Campaign Objective",
        description: "Campaign objective matches media plan",
      },
      {
        id: "ab_test",
        label: "A/B Test Setup",
        description: "A/B test configured if applicable per media plan",
      },
      {
        id: "advantage_campaign_budget",
        label: "Advantage Campaign Budget",
        description: "Advantage Campaign Budget selection matches media plan",
      },
    ],
  },

  // ── BUDGET & PACING ───────────────────────────────────────────────────────
  {
    id: "budget_pacing",
    title: "BUDGET & PACING",
    launchTypes: ["campaign_launch", "platform_launch", "budget_change"],
    items: [
      {
        id: "campaign_budget_matches",
        label: "Campaign Budget Matches Media Plan",
        description: "Campaign lifetime/daily budget matches pacing sheet and media plan",
      },
      {
        id: "campaign_flights",
        label: "Campaign Flights",
        description: "Campaign exists in pacing sheet with correct flight dates",
      },
      {
        id: "budget_type",
        label: "Budget Type (Daily vs. Lifetime)",
        description: "Budget type matches media plan — all ad sets use same budget type",
      },
      {
        id: "adset_budgets_sum",
        label: "Ad Set Budgets Sum Correctly",
        description: "Sum of ad set budgets does not exceed campaign budget amount",
      },
      {
        id: "budget_change_noted",
        label: "Budget Change Documented",
        description: "Budget change amount and reason noted in pacing sheet with effective date",
        // Only shown for budget_change launch type — handled by launchTypes on section
      },
    ],
  },

  // ── FLIGHT DATES ─────────────────────────────────────────────────────────
  {
    id: "flight_dates",
    title: "FLIGHT DATES",
    launchTypes: ["campaign_launch", "creative_launch", "platform_launch", "flight_extension"],
    items: [
      {
        id: "start_date",
        label: "Start Date",
        description: "Start date matches media plan and pacing sheet",
        perAdSetGroup: true,
      },
      {
        id: "end_date",
        label: "End Date",
        description: "End date matches media plan and pacing sheet",
        perAdSetGroup: true,
      },
      {
        id: "flight_extension_updated",
        label: "Flight Extension Updated in Pacing Sheet",
        description: "New end date documented in pacing sheet with reason for extension",
      },
    ],
  },

  // ── AD SET SETUP ──────────────────────────────────────────────────────────
  {
    id: "adset_setup",
    title: "AD SET SETUP",
    launchTypes: ["campaign_launch", "creative_launch", "platform_launch"],
    items: [
      {
        id: "adset_status_paused",
        label: "Ad Set Status — Paused",
        description: "Ad set status is paused during building",
        perAdSetGroup: true,
      },
      {
        id: "adset_naming",
        label: "Ad Set Naming Convention",
        description: "Ad set name created per naming convention",
        perAdSetGroup: true,
      },
      {
        id: "performance_goal",
        label: "Performance Goal",
        description: "Performance goal / optimization event matches media plan",
        perAdSetGroup: true,
      },
      {
        id: "pixel_selected",
        label: "Pixel Selected (Conversion Campaigns)",
        description: "Correct pixel selected — use 'New FB Pixel' for MSC",
        perAdSetGroup: true,
      },
      {
        id: "conversion_event",
        label: "Conversion Event",
        description: "Bid and optimization event outlined in media plan",
        perAdSetGroup: true,
      },
      {
        id: "frequency_cap",
        label: "Frequency Cap",
        description: "Frequency cap matches media plan (Social: 4x7)",
        perAdSetGroup: true,
      },
      {
        id: "dynamic_creative",
        label: "Dynamic Creative (DAT Campaigns)",
        description: "Dynamic creative toggle set correctly per media plan",
        perAdSetGroup: true,
      },
    ],
  },

  // ── TARGETING ────────────────────────────────────────────────────────────
  {
    id: "targeting",
    title: "TARGETING",
    launchTypes: ["campaign_launch", "platform_launch"],
    items: [
      {
        id: "audience_targeting",
        label: "Audience Targeting",
        description: "Audience targeting matches approved audience targeting doc",
        perAdSetGroup: true,
      },
      {
        id: "audience_exclusions",
        label: "Audience Exclusions",
        description: "Retargeting audiences excluded from prospecting audiences",
        perAdSetGroup: true,
      },
      {
        id: "location_targeting",
        label: "Location Targeting",
        description: "Market / geo matches media plan",
        perAdSetGroup: true,
      },
      {
        id: "geo_exclusions",
        label: "Geo Exclusions",
        description: "Exclusions match holdouts",
        perAdSetGroup: true,
      },
      {
        id: "age_targeting",
        label: "Age Targeting",
        description: "Age settings match media plan",
        perAdSetGroup: true,
      },
      {
        id: "gender_targeting",
        label: "Gender Targeting",
        description: "Gender settings match media plan; images and landing page match gender targeted",
        perAdSetGroup: true,
      },
      {
        id: "language_targeting",
        label: "Language Targeting",
        description: "Language settings match media plan",
        perAdSetGroup: true,
      },
      {
        id: "placements",
        label: "Placements",
        description: "Placements match what is outlined in media plan; each placement has creative with correct specs",
        perAdSetGroup: true,
      },
    ],
  },

  // ── CREATIVE / ADS ────────────────────────────────────────────────────────
  {
    id: "creative_ads",
    title: "CREATIVE / ADS",
    launchTypes: ["campaign_launch", "creative_launch", "platform_launch"],
    items: [
      {
        id: "ad_status_paused",
        label: "Ad Status — Paused",
        description: "Ad status is paused during building",
        perAdSetGroup: true,
      },
      {
        id: "ad_naming",
        label: "Ad Naming Convention",
        description: "Ad naming created per naming convention",
        perAdSetGroup: true,
      },
      {
        id: "fb_page",
        label: "Facebook Page",
        description: "Use MSCCruises.US page",
        perAdSetGroup: true,
      },
      {
        id: "ig_page",
        label: "Instagram Page",
        description: "Use MSCCruises.US page",
        perAdSetGroup: true,
      },
      {
        id: "creative_source",
        label: "Creative Source",
        description: "Manual Upload or Catalog — matches trafficking sheet",
        perAdSetGroup: true,
      },
      {
        id: "ad_format",
        label: "Ad Format",
        description: "Single Image, Video, Carousel, or Collection — matches trafficking sheet",
        perAdSetGroup: true,
      },
      {
        id: "multi_advertiser_ads",
        label: "Multi-Advertiser Ads OFF",
        description: "Multi-advertiser ads is checked OFF unless strategy says otherwise",
        perAdSetGroup: true,
      },
      {
        id: "media_creative",
        label: "Media / Creative",
        description: "Creative matches trafficking sheet; image/video specs correct",
        perAdSetGroup: true,
      },
      {
        id: "copy_headlines",
        label: "Copy / Headlines",
        description: "Asset specs correct; copy and headline checked against mockup; no spelling errors",
        perAdSetGroup: true,
      },
      {
        id: "primary_text",
        label: "Primary Text",
        description: "Primary text matches approved copy",
        perAdSetGroup: true,
      },
      {
        id: "headline",
        label: "Headline",
        description: "Headline matches approved copy",
        perAdSetGroup: true,
      },
      {
        id: "description",
        label: "Description",
        description: "Description matches approved copy",
        perAdSetGroup: true,
      },
      {
        id: "call_to_action",
        label: "Call to Action",
        description: "CTA matches trafficking sheet",
        perAdSetGroup: true,
      },
      {
        id: "partnership_ad",
        label: "Partnership Ad",
        description: "Used when running ads with creators — configured correctly",
        perAdSetGroup: true,
      },
      {
        id: "advantage_creative",
        label: "Advantage Creative Enhancements",
        description: "Advantage creative enhancements reviewed and set per strategy",
        perAdSetGroup: true,
      },
      {
        id: "info_labels",
        label: "Info Labels",
        description: "Make sure no labels are selected on unless required",
        perAdSetGroup: true,
      },
      {
        id: "add_destination",
        label: "Add a Destination",
        description: "Destination is checked on",
        perAdSetGroup: true,
      },
    ],
  },

  // ── TRACKING & URLS ───────────────────────────────────────────────────────
  {
    id: "tracking_urls",
    title: "TRACKING & URLS",
    launchTypes: ["campaign_launch", "creative_launch", "platform_launch"],
    items: [
      {
        id: "website_url",
        label: "Website URL",
        description: "Link-out page matches trafficking sheet; URL tested in browser",
        perAdSetGroup: true,
      },
      {
        id: "display_link",
        label: "Display Link",
        description: "msccruisesusa.com — consumers must see the brand domain",
        perAdSetGroup: true,
      },
      {
        id: "utm_tags",
        label: "UTM Tags",
        description: "UTM tags pulled from trafficking sheet; match ad attributes (start date, nameplate)",
        perAdSetGroup: true,
      },
      {
        id: "website_events",
        label: "Website Events",
        description: "Use pixel named 'New FB Pixel'",
        perAdSetGroup: true,
      },
      {
        id: "offline_events",
        label: "Offline Events",
        description: "Confirm we are NOT tracking offline events",
        perAdSetGroup: true,
      },
      {
        id: "click_tracker",
        label: "Click Tracker",
        description: "If using click trackers, confirm redirect is working correctly",
        perAdSetGroup: true,
      },
      {
        id: "view_tag",
        label: "View Tag (1x1 Pixel)",
        description: "View tag has correct secure 1x1 pixel included",
        perAdSetGroup: true,
      },
      {
        id: "preview_link",
        label: "Preview Link",
        description: "Preview link generated and reviewed on desktop and mobile",
        perAdSetGroup: true,
      },
    ],
  },

  // ── TRAFFICKING & PACING SHEET ────────────────────────────────────────────
  {
    id: "trafficking_pacing",
    title: "TRAFFICKING & PACING SHEET",
    launchTypes: ["campaign_launch", "creative_launch", "platform_launch", "budget_change", "flight_extension"],
    items: [
      {
        id: "paid_status_updated",
        label: "Paid Status Updated in Tracker",
        description: "Update paid status to reflect ad status (live, paused, completed, scaled)",
      },
      {
        id: "live_links_added",
        label: "Live Links Added to Tracker",
        description: "Live links for each ad added into trafficking sheet",
      },
      {
        id: "ping_media_channel",
        label: "Ping Media Channel",
        description: "Contact supervisor to inform QA is finished",
      },
    ],
  },

  // ── POST-LAUNCH QA ────────────────────────────────────────────────────────
  {
    id: "post_launch",
    title: "POST-LAUNCH QA",
    launchTypes: ["campaign_launch", "creative_launch", "platform_launch"],
    items: [
      {
        id: "all_pushed_correctly",
        label: "All Campaigns / Ad Sets / Ads Pushed Correctly",
        description: "When campaigns pushed to platform, confirm all ad sets and ads pushed through",
      },
      {
        id: "live_campaigns_active",
        label: "Live Campaigns / Ad Sets / Ads Are Active",
        description: "All campaigns, ad sets, and ads that should be live are live",
      },
      {
        id: "scheduled_campaigns_active",
        label: "Scheduled Campaigns Set to Active",
        description: "Scheduled campaigns are 'active' so they go live on their go-live date",
      },
      {
        id: "no_disapprovals",
        label: "No Immediate Disapprovals",
        description: "Check for any immediate disapprovals on ads post-launch",
      },
      {
        id: "30min_checkin",
        label: "30-Minute Check-In",
        description: "Confirm campaign is spending 30 minutes after going live",
      },
      {
        id: "no_overspend",
        label: "No Budget Overspend",
        description: "Campaigns did not spend their budget too quickly post-launch",
      },
    ],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function getSectionsForLaunchType(launchType: LaunchType): ChecklistSection[] {
  return CHECKLIST_SECTIONS.filter((s) => s.launchTypes.includes(launchType));
}

export const LAUNCH_TYPE_LABELS: Record<LaunchType, string> = {
  campaign_launch: "Campaign Launch",
  creative_launch: "Creative Launch",
  platform_launch: "Platform Launch",
  budget_change: "Budget Change",
  flight_extension: "Flight Extension",
};

export const LAUNCH_TYPE_DESCRIPTIONS: Record<LaunchType, string> = {
  campaign_launch: "Full new campaign build — includes campaign, ad sets, targeting, creative, and tracking setup",
  creative_launch: "New creatives added to existing ad sets — includes ad setup, copy, URLs, and UTMs",
  platform_launch: "Adding a new platform to an existing campaign — full campaign + ad set + creative setup",
  budget_change: "Budget adjustment to live campaign — documents change, updates pacing sheet",
  flight_extension: "Extending campaign end date — updates flight dates and pacing sheet",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  meta: "Meta (Facebook / Instagram)",
  google: "Google Ads",
  dv360: "DV360",
  yahoo: "Yahoo",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  snapchat: "Snapchat",
  other: "Other",
};

export const REVIEWER_LABELS: Record<string, string> = {
  builder: "Builder",
  qa1: "QA 1 — Manager",
  qa2: "QA 2 — Associate Director",
  md: "MD Final QA",
  ed: "ED",
};

export const STATUS_LABELS: Record<string, string> = {
  in_progress: "In Progress",
  pending_qa1: "Pending QA1",
  pending_qa2: "Pending QA2",
  pending_md: "Pending MD",
  approved: "Approved",
  rejected: "Rejected",
};

export const STATUS_COLORS: Record<string, string> = {
  in_progress: "bg-amber-100 text-amber-800",
  pending_qa1: "bg-blue-100 text-blue-800",
  pending_qa2: "bg-purple-100 text-purple-800",
  pending_md: "bg-orange-100 text-orange-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export const LAUNCH_TYPE_COLORS: Record<LaunchType, string> = {
  campaign_launch: "bg-[#000033] text-white",
  creative_launch: "bg-[#2D6C93] text-white",
  platform_launch: "bg-[#3D8CA4] text-white",
  budget_change: "bg-[#E8321A] text-white",
  flight_extension: "bg-[#68AEB6] text-white",
};
