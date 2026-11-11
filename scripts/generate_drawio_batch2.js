/**
 * Generates pure Draw.io XML (.drawio) files for Batch 2:
 * - activity-diagram-flow-3-return-settlement.drawio
 * - activity-diagram-flow-4-business-operations.drawio
 * - activity-diagram-flow-5-facility-staff-management.drawio
 */

const fs = require('fs');
const path = require('path');

const drawioDir = path.resolve('docs/diagrams/report/drawio');
if (!fs.existsSync(drawioDir)) fs.mkdirSync(drawioDir, { recursive: true });

function wrapDrawio(diagramName, cellsXml) {
  return `<mxfile host="Electron" modified="${new Date().toISOString()}" agent="draw.io" version="21.0.0" type="device">
  <diagram name="${diagramName}" id="${Math.random().toString(36).substring(2, 12)}">
    <mxGraphModel dx="1200" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1200" pageHeight="950" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        ${cellsXml}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

// 3. Flow 3: Return & Settlement
function generateDrawioFlow3() {
  const lanesXml = `
    <mxCell id="lane_0" value="Storage Customer" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="260" height="700" as="geometry" />
    </mxCell>
    <mxCell id="lane_1" value="Facility Staff" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="300" y="40" width="260" height="700" as="geometry" />
    </mxCell>
    <mxCell id="lane_2" value="Facility Manager" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="560" y="40" width="260" height="700" as="geometry" />
    </mxCell>
    <mxCell id="lane_3" value="Finance Ledger System" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="820" y="40" width="260" height="700" as="geometry" />
    </mxCell>
  `;

  const nodesXml = `
    <mxCell id="start" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="160" y="85" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="node_1" value="1. Schedule Return Date&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Normal or Win-Win Early Return)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="70" y="130" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_2" value="2. Exit Inspection &amp;amp; Photos&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Assess Damage, Trash &amp;amp; Lock)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="330" y="210" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_3" value="3. Set Unit: CLEANING&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Sanitization Queue, BR-RET-09)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="330" y="325" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_4" value="4. Review &amp;amp; Approve Voucher&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Net Settlement Formula)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="590" y="410" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_5" value="5. Record Double-Entry Ledger&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(LedgerEntry Immutable Audit)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="850" y="495" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_6" value="6. Receive Deposit Refund&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Contract CLOSED, Unit Available)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="70" y="580" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="end" value="" style="shape=ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="157" y="675" width="26" height="26" as="geometry" />
    </mxCell>
  `;

  const edgesXml = `
    <mxCell id="e_start" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="start" target="node_1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_1_2" value="Check-out Request" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_1" target="node_2">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_2_3" value="Inspection Logged" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_2" target="node_3">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_3_4" value="Damage Protocol" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_3" target="node_4">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_4_5" value="Authorize Ledger" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_4" target="node_5">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_5_6" value="Disburse Net Refund (3-5 days)" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_5" target="node_6">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_end" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="node_6" target="end">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  `;

  return wrapDrawio('Swimlane 3: Flow_3_Checkout_Return_And_Final_Settlement', lanesXml + nodesXml + edgesXml);
}

// 4. Flow 4: BOM Pricing & Policy
function generateDrawioFlow4() {
  const lanesXml = `
    <mxCell id="lane_0" value="Business Operations Manager" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="280" height="580" as="geometry" />
    </mxCell>
    <mxCell id="lane_1" value="Policy &amp;amp; Pricing Engine" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="320" y="40" width="280" height="580" as="geometry" />
    </mxCell>
    <mxCell id="lane_2" value="Branch Operations" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="600" y="40" width="280" height="580" as="geometry" />
    </mxCell>
  `;

  const nodesXml = `
    <mxCell id="start" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="170" y="85" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="node_1" value="1. Configure Master Types&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Dimensions &amp;amp; Base Monthly Rates)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="130" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_2" value="2. Set Regional Surcharges&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Prime Location / Branch Tier)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="245" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_3" value="3. Create Price &amp;amp; Policy Version&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Immutable Version Snapshot)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="360" y="330" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_4" value="4. Enforce on New Bookings&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Non-retroactive BR-GEN-02)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="640" y="415" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="end" value="" style="shape=ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="727" y="540" width="26" height="26" as="geometry" />
    </mxCell>
  `;

  const edgesXml = `
    <mxCell id="e_start" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="start" target="node_1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_1_2" value="Catalog Defined" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_1" target="node_2">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_2_3" value="Publish Pricing" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_2" target="node_3">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_3_4" value="Propagate Rules" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_3" target="node_4">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_end" value="Version Active" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_4" target="end">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  `;

  return wrapDrawio('Swimlane 4: Flow_4_BOM_Catalog_Pricing_And_Policy', lanesXml + nodesXml + edgesXml);
}

// 5. Flow 5: Facility Layout & Staff Scheduling
function generateDrawioFlow5() {
  const lanesXml = `
    <mxCell id="lane_0" value="Facility Manager (FM)" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="280" height="580" as="geometry" />
    </mxCell>
    <mxCell id="lane_1" value="Shift Dispatcher" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="320" y="40" width="280" height="580" as="geometry" />
    </mxCell>
    <mxCell id="lane_2" value="Facility Staff" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="600" y="40" width="280" height="580" as="geometry" />
    </mxCell>
  `;

  const nodesXml = `
    <mxCell id="start" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="170" y="85" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="node_1" value="1. Configure Floorplan Layout&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Zone, Row, Unit Coordinates)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="130" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_2" value="2. Build Weekly Shift Roster&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Morning &amp;amp; Afternoon Shifts)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="245" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_3" value="3. Generate Daily Worklist&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Check-ins, Returns, Cleaning)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="360" y="330" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_4" value="4. Execute Operations &amp;amp; Sign&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Staff Desk Terminal Portal)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="640" y="415" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="end" value="" style="shape=ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="727" y="540" width="26" height="26" as="geometry" />
    </mxCell>
  `;

  const edgesXml = `
    <mxCell id="e_start" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="start" target="node_1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_1_2" value="Floorplan Saved" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_1" target="node_2">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_2_3" value="Publish Roster" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_2" target="node_3">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_3_4" value="Assign Daily Tasks" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_3" target="node_4">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_end" value="Shift Logged" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_4" target="end">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  `;

  return wrapDrawio('Swimlane 5: Flow_5_Facility_Layout_And_Staff_Scheduling', lanesXml + nodesXml + edgesXml);
}

fs.writeFileSync(path.join(drawioDir, 'activity-diagram-flow-3-return-settlement.drawio'), generateDrawioFlow3());
fs.writeFileSync(path.join(drawioDir, 'activity-diagram-flow-4-business-operations.drawio'), generateDrawioFlow4());
fs.writeFileSync(path.join(drawioDir, 'activity-diagram-flow-5-facility-staff-management.drawio'), generateDrawioFlow5());

console.log('Successfully generated pure Draw.io XML for Batch 2 (Flow 3, Flow 4, Flow 5).');

