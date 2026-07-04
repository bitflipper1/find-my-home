# Charlotte-Mecklenburg Public Data Stack — New Construction & Growth Signals

> Source: user-supplied deep research (ingested 2026-07-05). This is the official-data layer:
> strongest for location selection, growth detection, and due diligence; indirect (but powerful)
> for builder incentives via supply-pressure signals.

## The boom signal (and the false-boom pattern)

**Next-booming-area = the intersection of three things:**
1. Favorable long-range designation on the **Charlotte Future 2040 Policy Map** (Neighborhood Center / Community Activity Center / Regional Activity Center / Innovation Mixed-Use / Manufacturing & Logistics place types)
2. Active **rezoning / site-plan / land-development pipeline** (landowners actively moving entitlements)
3. **Committed capital or utility investment** (Capital Projects Dashboard, STIP/TIP, CATS, Charlotte Water capacity)

**False-boom pattern:** policy support without infrastructure/capacity support, or visible developer interest paired with floodplain, sewer-capacity (CAP), or public-opposition constraints. Charlotte Water's Capacity Assurance Program explicitly warns CAP approval does not guarantee downstream infrastructure gets built.

**Builder-deal proxy:** permit/CO clusters = supply bulge = negotiability. Large clusters of recently issued residential permits, rising CO counts, or many active/pre-submittal projects in one corridor indicate builder pressure — even when the actual buydown/credit is only advertised privately. Public data prices the *leverage and timing*, not the incentive terms.

## The 8-step workflow ("kill the lot before the lot kills the deal")

1. **Screen the growth path** — Policy Map place type + Community Area Plan geography for the parcel/corridor
2. **Confirm present entitlements** — current zoning, pending rezonings, rezoning history + staff analyses
3. **Check ownership & encumbrances** — POLARIS/GeoPortal triage → Assessor → Register of Deeds (GIS is reference-only; deeds/plats are dispositive)
4. **Measure live supply** — city land-development project search + county permit/CO dashboards
5. **Screen infrastructure feasibility** — Capital Projects, STIP/TIP, CATS plans, Charlotte Water CAP limits
6. **Kill the lot before the lot kills the deal** — floodplain, floodway, wetlands, buffers, brownfields (test adjacent parcels too)
7. **Neighborhood-risk filters** — CMPD incidents (12–24 mo, property vs violent split) + Quality of Life Explorer, then block-level fieldwork
8. **Only then price the leverage** — compare builder/brokerage incentives after supply, timing, and risk are clear

## Source inventory (key systems)

| Source | URL | Use |
|---|---|---|
| Charlotte Open Data Portal | data.charlottenc.gov | Front door for city geospatial/tabular datasets |
| Mecklenburg GIS / Open Mapping / IDS | gis.mecknc.gov/data-center · maps.mecklenburgcountync.gov | Countywide overlays + statistical dashboards (reference-only disclaimer) |
| Charlotte Future 2040 Policy Map | services.arcgis.com/9Nl857LBlQVyzq54/.../Charlotte_Future_2040_Policy_Map/FeatureServer/0 | THE future-growth layer; PlaceTypeFullTxt/PlaceTypeCde fields; policy ≠ entitlement |
| Zoning / Rezonings / RezoningHistory / VacantLand | gis.charlottenc.gov/arcgis/rest/services/PLN/* | Entitlement-change stack; pending petitions reveal where land is trying to move |
| POLARIS + GeoPortal | polaris3g.mecklenburgcountync.gov · gis.mecknc.gov | Parcel/overlay triage (80+ overlays: flood, buffers, school zones, ownership) |
| Assessor + Tax bills | cao.mecknc.gov · property.spatialest.com/nc/mecklenburg | Ownership, assessment, tax status before title work |
| Delinquent taxes + tax foreclosures | tax.mecknc.gov/services/* | Distress & land-assembly signal (top-100 delinquent monthly; foreclosure listings + map) |
| Register of Deeds | deeds.mecknc.gov/services/real-estate-records | Index from 9/28/1990; images from 3/1/1973; the dispositive record |
| Rezoning case files / council agendas / minutes | charlottenc.gov Rezoning + Legistar | Petition packets, staff analyses, site plans = the highest-value planning docs |
| City land-development project search | aca-prod.accela.com/CHARLOTTE + Land_Development_Commercial_Projects FeatureServer | Forward-looking supply: Approved/Active/Pre-Submittal categories |
| County permits/inspections/CO | code.mecknc.gov · aca-prod.accela.com/Mecklenburg · WebPermit | 100K+ permits/yr, 320K+ inspections/yr; ~6 yrs online doc retention; watch daily permit + CO acceleration |
| CMPD incidents + QOL Explorer | gis.charlottenc.gov/arcgis/rest/services/CMPD/CMPDIncidents/MapServer/0 · QOL service | Incident-level micro-screening (NPA + patrol division fields); QOL for income/health/education context |
| Capital projects / CATS / CRTPO / NCDOT STIP / Charlotte Water CAP | charlottenc.gov Capital-Projects-Dashboard etc. | Infrastructure-growth stack; CAP reserves capacity 2 yrs, no downstream guarantee |
| Flood / wetlands / brownfields | FRIS (fris.nc.gov) · FWS Wetlands Mapper · NC DEQ brownfields map | ~20K acres regulatory floodplain, 20K+ parcels touching it; decisive lot-feasibility filter |
| CMS boundaries + capacity | cmsk12.org planning + ArcGIS experience app | Annual boundary maps; 5–10 yr enrollment forecasts; redistricting = resale/political risk signal |
| Center City Partners / Axios CLT / CBJ Crane Watch | charlottecentercity.org · bizjournals.com/charlotte | Pipeline narrative overlay AFTER official data ($4B+ center-city pipeline) |
| Terra Vista Realty new-home rebate | terravistarealty.com/new-home-rebate.cfm | Rare public buyer-side rebate page — private brokerage overlay, not a public program |

## Comparison matrix (relative usefulness)

| Source family | Incentives | Growth | Risk | Diligence |
|---|---|---|---|---|
| Policy Map + CAPs | Low | **Very high** | Med | Med |
| Zoning/rezonings stack | Low | **Very high** | Med | High |
| Parcel/assessor/deeds/tax/foreclosure | Low | Med | High | **Very high** |
| Permit / CO systems | **High** | High | Med | **Very high** |
| Capital projects + transit + Water CAP | Med | **Very high** | **Very high** | High |
| CMPD + QOL | Low | Med | **Very high** | Med |
| Flood/wetlands/brownfields | Low | Low | **Very high** | **Very high** |
| CMS boundaries/capacity | Low | Med | Med | Med |
| CCP / Axios / CBJ | Med | High | Low | Low |
| Terra Vista rebates | **Very high** | Low | Low | Low |

## Documented REST query patterns (wired into /api/live/*)

```http
# Policy Map: activity-center place types
GET .../Charlotte_Future_2040_Policy_Map/FeatureServer/0/query
  ?where=PlaceTypeFullTxt IN ('Community Activity Center','Regional Activity Center','Neighborhood Center')
  &outFields=PlaceTypeFullTxt,PlaceTypeCde&f=json

# Parcel zoning by PID
GET gis.charlottenc.gov/.../ODP/Parcel_Zoning_Lookup/MapServer/0/query
  ?where=PID='12345678'&outFields=PID,Tax_ID,Zoning,RezoneDate&f=json

# CMPD incidents: property crime, last 12-24 mo
GET gis.charlottenc.gov/.../CMPD/CMPDIncidents/MapServer/0/query
  ?where=DATE_REPORTED >= DATE '2026-01-01' AND HIGHEST_NIBRS_DESCRIPTION IN ('MOTOR VEHICLE THEFT','BURGLARY/BREAKING & ENTERING')
  &outFields=DATE_REPORTED,CMPD_PATROL_DIVISION,NPA,HIGHEST_NIBRS_DESCRIPTION,CLEARANCE_STATUS&f=json

# Pending rezonings
GET gis.charlottenc.gov/.../PLN/Rezonings/MapServer/0/query?where=1=1&outFields=*&f=geojson

# Land-development commercial pipeline (Approved/Active/Pre-Submittal)
GET services.arcgis.com/9Nl857LBlQVyzq54/.../Land_Development_Commercial_Projects/FeatureServer/0/query?where=1=1&outFields=*&f=json
```

## Corridor-scoring pattern (future build: the parcel scorer)

Score = policy support (place type) + entitlement activity (pending rezonings within 1 mi) + supply timing (active/pre-submittal projects within 1 mi) + infrastructure support (funded projects in design/construction nearby) − environmental constraint (floodplain/wetland intersect) ± crime context (NPA property-crime rate). The SQL join pattern is in the original research doc; implementation needs a staged PostGIS or client-side spatial pass.

## Limitations

- Builder incentives are NOT in official data — public systems price leverage/timing, not the 5.99% buydown
- WebPermit has browser constraints; some dashboards are Power BI viewers; ~6-yr online doc retention at Code Enforcement
- Mecklenburg disclaims GIS accuracy — recorded deeds/plats govern
- CCP's State of the Center City report is form-gated; CBJ may be paywalled; Terra Vista is a private brokerage offer
- Where cadence isn't published, treat update frequency as "variable / department-maintained"
