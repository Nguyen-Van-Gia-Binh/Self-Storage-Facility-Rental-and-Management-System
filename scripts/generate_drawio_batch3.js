/**
 * Generates pure Draw.io XML (.drawio) files for Batch 3:
 * - activity-diagram-flow-6-1-storage-renewal.drawio
 * - activity-diagram-flow-6-2-overdue-handling.drawio
 * - activity-diagram-flow-7-support-incident-handling.drawio
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

// 6.1 Renewal
function generateDrawioFlow61() {
  const lanesXml = `
    <mxCell id="lane_0" value="Storage Customer" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="280" height="690" as="geometry" />
    </mxCell>
    <mxCell id="lane_1" value="Billing &amp;amp; Contract Engine" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="320" y="40" width="280" height="690" as="geometry" />
    </mxCell>
    <mxCell id="lane_2" value="Facility Manager" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="600" y="40" width="280" height="690" as="geometry" />
    </mxCell>
  `;

  const nodesXml = `
    <mxCell id="start" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="170" y="85" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="node_1" value="1. Open Renewal Portal&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Window: T-30 to T-20 days)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="130" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_2" value="2. Select Extension (1-12 Mos)&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Deposit Carries Forward)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="245" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_3" value="3. Verify No Next Reservation&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Anti-Overlap Check, BR-REN-02)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="360" y="330" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_4" value="4. Resolve Unit Conflict&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Reassign Same-Type Unit)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="640" y="415" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_5" value="5. Complete VNPay Renewal&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Extension Invoice Settled)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="500" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_6" value="6. Extend Contract End Date&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Contract Remains ACTIVE)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="360" y="585" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="end" value="" style="shape=ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="447" y="680" width="26" height="26" as="geometry" />
    </mxCell>
  `;

  const edgesXml = `
    <mxCell id="e_start" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="start" target="node_1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_1_2" value="Eligible Lease" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_1" target="node_2">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_2_3" value="Check Unit Conflict" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_2" target="node_3">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_3_4" value="Resolve Conflict" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_3" target="node_4">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_4_5" value="Clear to Pay Extension" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_4" target="node_5">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_5_6" value="IPN Payment Success" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_5" target="node_6">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_end" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="node_6" target="end">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  `;

  return wrapDrawio('Swimlane 6.1: Flow_6_1_Customer_Online_Renewal', lanesXml + nodesXml + edgesXml);
}

// 6.2 Overdue
function generateDrawioFlow62() {
  const lanesXml = `
    <mxCell id="lane_0" value="System Schedulers (Cron)" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="280" height="720" as="geometry" />
    </mxCell>
    <mxCell id="lane_1" value="Storage Customer" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="320" y="40" width="280" height="720" as="geometry" />
    </mxCell>
    <mxCell id="lane_2" value="Staff &amp;amp; Central Warehouse" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="600" y="40" width="280" height="720" as="geometry" />
    </mxCell>
  `;

  const nodesXml = `
    <mxCell id="start" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="170" y="85" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="node_1" value="1. Midnight Scan at Day D+1&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Transition to OVERDUE)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="130" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_2" value="2. Suspend Smart Lock PIN&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(&quot;No Pay, No PIN&quot; BR-OVD-01)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="245" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_3" value="3. Receive Daily Debt Notices&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Grace D+1..3, Penalty D+4..6)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="360" y="330" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_4" value="4. Day D+7: Terminate Contract&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(100% Deposit Liquidated)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="415" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_5" value="5. Seal Unit &amp;amp; Impound Goods&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Transfer to Central Wh 30 Days)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="640" y="500" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_6" value="6. Release Unit: AVAILABLE&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Day D+8, Buffer: 8 Days)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="640" y="615" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="end" value="" style="shape=ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="727" y="710" width="26" height="26" as="geometry" />
    </mxCell>
  `;

  const edgesXml = `
    <mxCell id="e_start" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="start" target="node_1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_1_2" value="Unpaid Past Maturity" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_1" target="node_2">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_2_3" value="Alert SMS / Email" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_2" target="node_3">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_3_4" value="No Payment by Day D+7" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_3" target="node_4">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_4_5" value="Eviction Work Order" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_4" target="node_5">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_5_6" value="Sanitization Complete" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_5" target="node_6">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_end" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="node_6" target="end">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  `;

  return wrapDrawio('Swimlane 6.2: Flow_6_2_Overdue_Escalation_And_Eviction', lanesXml + nodesXml + edgesXml);
}

// 7. Support
function generateDrawioFlow7() {
  const lanesXml = `
    <mxCell id="lane_0" value="Storage Customer" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="280" height="630" as="geometry" />
    </mxCell>
    <mxCell id="lane_1" value="Facility Staff" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="320" y="40" width="280" height="630" as="geometry" />
    </mxCell>
    <mxCell id="lane_2" value="Facility Manager" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="600" y="40" width="280" height="630" as="geometry" />
    </mxCell>
  `;

  const nodesXml = `
    <mxCell id="start" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="170" y="85" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="node_1" value="1. Submit Support Ticket&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Lock / Leak / Billing / Damage)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="130" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_2" value="2. Investigate &amp;amp; Resolve Issue&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Temp PIN / Battery / Inspection)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="360" y="215" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_3" value="3. Approve Compensation&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Insurance Cap: 10M / 50M)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="640" y="300" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_4" value="4. Mark Ticket: RESOLVED&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Auto-close after 72 Hours)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="360" y="385" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="node_5" value="5. Confirm &amp;amp; Rate Support&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Ticket CLOSED)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="470" width="200" height="60" as="geometry" />
    </mxCell>
    <mxCell id="end" value="" style="shape=ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="167" y="575" width="26" height="26" as="geometry" />
    </mxCell>
  `;

  const edgesXml = `
    <mxCell id="e_start" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="start" target="node_1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_1_2" value="Claim Ticket" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_1" target="node_2">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_2_3" value="Escalate Major Claim" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_2" target="node_3">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_3_4" value="Resolution Approved" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_3" target="node_4">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_4_5" value="Notify Resolution" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_4" target="node_5">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="e_end" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="node_5" target="end">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  `;

  return wrapDrawio('Swimlane 7: Flow_7_Customer_Support_And_Incident_Resolution', lanesXml + nodesXml + edgesXml);
}

fs.writeFileSync(path.join(drawioDir, 'activity-diagram-flow-6-1-storage-renewal.drawio'), generateDrawioFlow61());
fs.writeFileSync(path.join(drawioDir, 'activity-diagram-flow-6-2-overdue-handling.drawio'), generateDrawioFlow62());
fs.writeFileSync(path.join(drawioDir, 'activity-diagram-flow-7-support-incident-handling.drawio'), generateDrawioFlow7());

console.log('Successfully generated pure Draw.io XML for Batch 3 (Flow 6.1, Flow 6.2, Flow 7).');
