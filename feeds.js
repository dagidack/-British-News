const bbc = (path) =>
  path
    ? `https://feeds.bbci.co.uk/news/${path}/rss.xml`
    : "https://feeds.bbci.co.uk/news/rss.xml";

const localFeeds = [
  { name: "Manchester Evening News", url: "https://www.manchestereveningnews.co.uk/?service=rss" },
  { name: "Liverpool Echo", url: "https://www.liverpoolecho.co.uk/?service=rss" },
  { name: "Birmingham Mail", url: "https://www.birminghammail.co.uk/?service=rss" },
  { name: "Yorkshire Post", url: "https://www.yorkshirepost.co.uk/rss" },
  { name: "Chronicle Live", url: "https://www.chroniclelive.co.uk/?service=rss" },
  { name: "Bristol Live", url: "https://www.bristolpost.co.uk/?service=rss" },
  { name: "Wales Online", url: "https://www.walesonline.co.uk/?service=rss" },
  { name: "The Herald", url: "https://www.heraldscotland.com/rss/" },
  { name: "Belfast Telegraph", url: "https://www.belfasttelegraph.co.uk/rss" },
];

module.exports = {
  tabs: [
    {
      id: "national",
      label: "Home",
      feeds: [
        { name: "BBC News", url: bbc() },
        { name: "BBC UK", url: bbc("uk") },
        { name: "The Guardian", url: "https://www.theguardian.com/uk/rss" },
        { name: "The Independent", url: "https://www.independent.co.uk/news/uk/rss" },
        { name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/uk.xml" },
        { name: "Evening Standard", url: "https://www.standard.co.uk/rss" },
        ...localFeeds,
      ],
    },
    {
      id: "london",
      label: "London",
      feeds: [
        { name: "BBC London", url: bbc("england/london") },
        { name: "Evening Standard", url: "https://www.standard.co.uk/rss" },
        { name: "BBC England", url: bbc("england") },
      ],
    },
    {
      id: "south-east",
      label: "South East",
      feeds: [
        { name: "BBC Kent", url: bbc("england/kent") },
        { name: "BBC Surrey", url: bbc("england/surrey") },
        { name: "BBC Sussex", url: bbc("england/sussex") },
        { name: "BBC Hampshire", url: bbc("england/hampshire") },
      ],
    },
    {
      id: "south-west",
      label: "South West",
      feeds: [
        { name: "BBC Bristol", url: bbc("england/bristol") },
        { name: "BBC Devon", url: bbc("england/devon") },
        { name: "BBC Cornwall", url: bbc("england/cornwall") },
        { name: "Bristol Live", url: "https://www.bristolpost.co.uk/?service=rss" },
      ],
    },
    {
      id: "east-of-england",
      label: "East of England",
      feeds: [
        { name: "BBC Norfolk", url: bbc("england/norfolk") },
        { name: "BBC Suffolk", url: bbc("england/suffolk") },
        { name: "BBC Essex", url: bbc("england/essex") },
        { name: "BBC Cambridgeshire", url: bbc("england/cambridgeshire") },
      ],
    },
    {
      id: "west-midlands",
      label: "West Midlands",
      feeds: [
        { name: "BBC Birmingham", url: bbc("england/birmingham_and_black_country") },
        { name: "BBC Coventry", url: bbc("england/coventry_and_warwickshire") },
        { name: "Birmingham Mail", url: "https://www.birminghammail.co.uk/?service=rss" },
      ],
    },
    {
      id: "east-midlands",
      label: "East Midlands",
      feeds: [
        { name: "BBC Nottingham", url: bbc("england/nottingham") },
        { name: "BBC Leicester", url: bbc("england/leicester") },
        { name: "BBC Derby", url: bbc("england/derby") },
        { name: "BBC Lincolnshire", url: bbc("england/lincolnshire") },
      ],
    },
    {
      id: "yorkshire",
      label: "Yorkshire & Humber",
      feeds: [
        { name: "BBC Leeds", url: bbc("england/leeds") },
        { name: "BBC Sheffield", url: bbc("england/south_yorkshire") },
        { name: "BBC York", url: bbc("england/york_and_north_yorkshire") },
        { name: "Yorkshire Post", url: "https://www.yorkshirepost.co.uk/rss" },
      ],
    },
    {
      id: "north-west",
      label: "North West",
      feeds: [
        { name: "BBC Manchester", url: bbc("england/manchester") },
        { name: "BBC Liverpool", url: bbc("england/merseyside") },
        { name: "BBC Lancashire", url: bbc("england/lancashire") },
        { name: "Manchester Evening News", url: "https://www.manchestereveningnews.co.uk/?service=rss" },
        { name: "Liverpool Echo", url: "https://www.liverpoolecho.co.uk/?service=rss" },
      ],
    },
    {
      id: "north-east",
      label: "North East",
      feeds: [
        { name: "BBC Newcastle", url: bbc("england/tyne_and_wear") },
        { name: "BBC Tees", url: bbc("england/tees") },
        { name: "Chronicle Live", url: "https://www.chroniclelive.co.uk/?service=rss" },
      ],
    },
    {
      id: "scotland",
      label: "Scotland",
      feeds: [
        { name: "BBC Scotland", url: bbc("scotland") },
        { name: "BBC Glasgow", url: bbc("scotland/glasgow_and_west") },
        { name: "BBC Edinburgh", url: bbc("scotland/edinburgh_east_and_fife") },
        { name: "BBC Aberdeen", url: bbc("scotland/north_east_orkney_and_shetland") },
        { name: "The Herald", url: "https://www.heraldscotland.com/rss/" },
      ],
    },
    {
      id: "wales",
      label: "Wales",
      feeds: [
        { name: "BBC Wales", url: bbc("wales") },
        { name: "BBC Cardiff", url: bbc("wales/south_east_wales") },
        { name: "BBC North Wales", url: bbc("wales/north_west_wales") },
        { name: "Wales Online", url: "https://www.walesonline.co.uk/?service=rss" },
      ],
    },
    {
      id: "northern-ireland",
      label: "Northern Ireland",
      feeds: [
        { name: "BBC Northern Ireland", url: bbc("northern_ireland") },
        { name: "Belfast Telegraph", url: "https://www.belfasttelegraph.co.uk/rss" },
      ],
    },
  ],
};
