/**
 * Generates pure Draw.io XML (.drawio) files for Batch 1:
 * - activity-diagram-flow-0-end-to-end.drawio
 * - activity-diagram-flow-1-storage-reservation.drawio
 * - activity-diagram-flow-2-checkin-handover.drawio
 * Strict compliance with Enterprise Design Rules:
 * - 200x60px node dimensions
 * - 260px vertical swimlanes
 * - Orthogonal routing only (edgeStyle=orthogonalEdgeStyle;rounded=0;)
 * - labelBackgroundColor=#ffffff on all edges
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

// 0. End to End
function generateDrawioEndToEnd() {
  const lanesXml = `
    <!-- Lanes -->
    <mxCell id="lane_0" value="Storage Customer" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="260" height="740" as="geometry" />
    </mxCell>
    <mxCell id="lane_1" value="Facility Staff" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="300" y="40" width="260" height="740" as="geometry" />
    </mxCell>
    <mxCell id="lane_2" value="Facility Manager" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="560" y="40" width="260" height="740" as="geometry" />
    </mxCell>
    <mxCell id="lane_3" value="System Schedulers" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="820" y="40" width="260" height="740" as="geometry" />
    </mxCell>
  `;

  const nodesXml = `
    <!-- Start -->
    <mxCell id="start" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="160" y="90" width="20" height="20" as="geometry" />
    </mxCell>

    <!-- Node 1: Customer Reserve -->
    <mxCell id="node_1" value="1. Reserve Unit &amp;amp; Pay Deposit&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(BR-PRI-01, BR-DEP-01)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="70" y="140" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node 2: FM Allocate -->
    <mxCell id="node_2" value="2. Allocate Storage Unit&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Late Binding, BR-AVL-04)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="590" y="210" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node 3: Staff Handover -->
    <mxCell id="node_3" value="3. 4-Point Handover &amp;amp; PIN&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Lock, Clean, Light, Air)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="330" y="280" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node 4: Customer Occupy -->
    <mxCell id="node_4" value="4. Occupy &amp;amp; Store Goods&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(24/7 Keypad Access Portal)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="70" y="360" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node 5: System Schedulers Overdue Scan -->
    <mxCell id="node_5" value="5. Daily Midnight Overdue Scan&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Cron 00:00:00, BR-OVD-01)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="850" y="430" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node 6: Staff Overdue / Return -->
    <mxCell id="node_6" value="6. Overdue Handling / Return&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Inspection &amp;amp; Settlement)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="330" y="510" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node 7: FM Approve Settlement -->
    <mxCell id="node_7" value="7. Approve Final Settlement&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Refund Deposit, BR-DEP-03)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="590" y="590" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- End -->
    <mxCell id="end" value="" style="shape=ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="677" y="695" width="26" height="26" as="geometry" />
    </mxCell>
  `;

  const edgesXml = `
    <mxCell id="e_start" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="start" target="node_1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_1_2" value="Deposit Confirmed (48h)" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_1" target="node_2">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_2_3" value="Move-in Pass Issued" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_2" target="node_3">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_3_4" value="PIN Delivered &amp;amp; Active" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_3" target="node_4">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_4_5" value="Lease Expiry (No Renewal)" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_4" target="node_5">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_5_6" value="Lock PIN Day D+1 (BR-OVD-01)" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_5" target="node_6">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_6_7" value="Checkout Inspection Passed" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_6" target="node_7">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_7_end" value="Contract Completed" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_7" target="end">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  `;

  return wrapDrawio('Swimlane 0: End_To_End_Operational_Lifecycle', lanesXml + nodesXml + edgesXml);
}

// 1. Flow 1: Storage Unit Reservation & Payment
function generateDrawioFlow1() {
  const lanesXml = `
    <mxCell id="lane_0" value="Storage Customer" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="280" height="820" as="geometry" />
    </mxCell>
    <mxCell id="lane_1" value="System (Portal &amp;amp; VNPay)" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="320" y="40" width="280" height="820" as="geometry" />
    </mxCell>
    <mxCell id="lane_2" value="Facility Manager" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="600" y="40" width="280" height="820" as="geometry" />
    </mxCell>
  `;

  const nodesXml = `
    <!-- Start -->
    <mxCell id="start" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="170" y="85" width="20" height="20" as="geometry" />
    </mxCell>

    <!-- Node 1: Select Facility -->
    <mxCell id="node_1" value="Select Facility &amp;amp; Unit Type&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(BR-PRI-01, BR-GEN-03)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="130" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Decision: Available? -->
    <mxCell id="dec_1" value="Capacity &amp;gt; 0?" style="rhombus;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="405" y="195" width="110" height="60" as="geometry" />
    </mxCell>

    <!-- Node Waitlist -->
    <mxCell id="node_wait" value="Opt-in FIFO Waitlist&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Queue Position, BR-WAT-01)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="250" width="200" height="60" as="geometry" />
    </mxCell>

    <mxCell id="end_wait" value="" style="shape=ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="167" y="340" width="26" height="26" as="geometry" />
    </mxCell>

    <!-- Node Hold 48h -->
    <mxCell id="node_hold" value="Hold Unit 48h &amp;amp; Calc Rent&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Deposit + 1st Month, BR-DEP-01)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="360" y="300" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node Customer Pay -->
    <mxCell id="node_pay" value="Complete VNPay Payment&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Secure Sandbox Callback)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="400" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node Confirm Reservation -->
    <mxCell id="node_confirm" value="Confirm Reservation&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Status: CONFIRMED)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="360" y="480" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node Allocate Unit -->
    <mxCell id="node_allocate" value="Allocate Physical Unit&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Late Binding, BR-AVL-04)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="640" y="560" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node Issue Pass -->
    <mxCell id="node_pass" value="Issue Move-in Pass &amp;amp; QR&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(PENDING_CHECK_IN)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="360" y="640" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node Receive Pass -->
    <mxCell id="node_receive" value="Receive Move-in Pass&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Ready for Physical Handover)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="720" width="200" height="60" as="geometry" />
    </mxCell>

    <mxCell id="end_main" value="" style="shape=ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="167" y="810" width="26" height="26" as="geometry" />
    </mxCell>
  `;

  const edgesXml = `
    <mxCell id="e_start" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="start" target="node_1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_check" value="Check Capacity" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_1" target="dec_1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_no" value="[No] Full Capacity" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="dec_1" target="node_wait">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_end_wait" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="node_wait" target="end_wait">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_yes" value="[Yes] Slot Available" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="dec_1" target="node_hold">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_vnpay" value="Redirect to VNPay URL" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_hold" target="node_pay">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_paid" value="IPN Payment Success" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_pay" target="node_confirm">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_disp" value="Dispatch Physical Binding" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_confirm" target="node_allocate">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_bound" value="Unit Assigned (Comp ID)" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_allocate" target="node_pass">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_notify" value="Push Notification &amp;amp; Pass" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_pass" target="node_receive">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_end_main" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="node_receive" target="end_main">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  `;

  return wrapDrawio('Swimlane 1: Flow_1_Storage_Unit_Reservation_And_Payment', lanesXml + nodesXml + edgesXml);
}

// 2. Flow 2: Check-in & Handover
function generateDrawioFlow2() {
  const lanesXml = `
    <mxCell id="lane_0" value="Storage Customer" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="280" height="740" as="geometry" />
    </mxCell>
    <mxCell id="lane_1" value="Facility Staff" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="320" y="40" width="280" height="740" as="geometry" />
    </mxCell>
    <mxCell id="lane_2" value="Smart Lock &amp;amp; System" style="swimlane;html=1;startSize=35;fillColor=#f8f9fa;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;fontSize=13;fontFamily=Arial;" vertex="1" parent="1">
      <mxGeometry x="600" y="40" width="280" height="740" as="geometry" />
    </mxCell>
  `;

  const nodesXml = `
    <!-- Start -->
    <mxCell id="start" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="170" y="85" width="20" height="20" as="geometry" />
    </mxCell>

    <!-- Node 1: Present QR -->
    <mxCell id="node_1" value="Present Move-in Pass QR&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Arrive at Facility on Start Date)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="130" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node 2: Verify Pass -->
    <mxCell id="node_2" value="Verify Citizen ID &amp;amp; Pass&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Staff Desk Terminal, BR-CHK-01)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="360" y="200" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node 3: Execute Inspection -->
    <mxCell id="node_3" value="Execute 4-Point Inspection&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Lock, Cleanliness, Light, Air)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="360" y="290" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node 4: Sign Protocol -->
    <mxCell id="node_4" value="Sign Handover Protocol&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Digital Sign on Tablet)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="370" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node 5: Generate PIN -->
    <mxCell id="node_5" value="Generate 6-Digit PIN&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Sync to Smart Lock Keypad)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="640" y="450" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node 6: Contract ACTIVE -->
    <mxCell id="node_6" value="Transition Contract ACTIVE&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(Storage Unit: OCCUPIED)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="640" y="540" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- Node 7: Customer Store PIN -->
    <mxCell id="node_7" value="Store PIN in App &amp;amp; Move-in&lt;br&gt;&lt;font color=&quot;#555555&quot; style=&quot;font-size: 10px;&quot;&gt;(24/7 Gate &amp;amp; Unit Access)&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=12;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="80" y="620" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- End -->
    <mxCell id="end" value="" style="shape=ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="167" y="710" width="26" height="26" as="geometry" />
    </mxCell>
  `;

  const edgesXml = `
    <mxCell id="e_start" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="start" target="node_1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_scan" value="Scan QR Pass" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_1" target="node_2">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_id" value="ID Matched" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_2" target="node_3">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_sign" value="Request Signature" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_3" target="node_4">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_cosign" value="Protocol Co-Signed &amp;amp; Stored" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_4" target="node_5">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_sync" value="Keypad Provisioned" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_5" target="node_6">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_pin" value="Deliver Secure Access PIN" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontFamily=Arial;fontSize=11;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="node_6" target="node_7">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <mxCell id="e_end" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;" edge="1" parent="1" source="node_7" target="end">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  `;

  return wrapDrawio('Swimlane 2: Flow_2_Checkin_Physical_Handover_And_PIN_Activation', lanesXml + nodesXml + edgesXml);
}

// Write files
fs.writeFileSync(path.join(drawioDir, 'activity-diagram-flow-0-end-to-end.drawio'), generateDrawioEndToEnd());
fs.writeFileSync(path.join(drawioDir, 'activity-diagram-flow-1-storage-reservation.drawio'), generateDrawioFlow1());
fs.writeFileSync(path.join(drawioDir, 'activity-diagram-flow-2-checkin-handover.drawio'), generateDrawioFlow2());

console.log('Successfully generated pure Draw.io XML for Batch 1 (Flow 0, Flow 1, Flow 2).');

