//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

module.exports = function(data){
  return {
    style: 'tableExample',
    color: '#444',
    table: {
        widths: [ 120, 100, 'auto', 'auto', 'auto', 'auto',  'auto', 'auto', 'auto', 'auto'],
        body: buildTableBody(data)
    }
  };

};

function eval_port(from_port, to_port){
  if(from_port && to_port){
    return from_port === to_port ? from_port.toString(): from_port.toString()+"-"+to_port.toString();
  }
  else{
    return 'All';
  }
}

function eval_protocol(ip_protocol){
  return ip_protocol === '-1' ? 'All' : ip_protocol;
}

function buildTableBody(data) {
    var body = [];
    var firstRow = [{ rowSpan: 2, text: 'Description',  style: 'tableHeader' },
            { rowSpan: 2, text: 'Group ID',style: 'tableHeader' },
            { colSpan: 4, text: 'Inbound', style: 'tableHeader' },
            'x','x','xx',
            { colSpan: 4, text: 'Outbound', style: 'tableHeader' },
            'x', 'x', 'x',];
    var secondRow = ['x' , 'x',
      {text: 'Type', style: 'tableHeader' },
      {text: 'Protocol', style: 'tableHeader' },
      {text: 'Source',  style: 'tableHeader' },
      {text: 'Port Range',  style: 'tableHeader' },
      {text: 'Type',  style: 'tableHeader' },
      {text: 'Protocol', style: 'tableHeader' },
      {text: 'Port Range', style: 'tableHeader' },
      {text: 'Source',  style: 'tableHeader' },
    ];

    body.push(firstRow, secondRow);

    data.forEach(function(v) {
      var inbound =  v.ip_permissions;
      var outbound = v.ip_permissions_egress;

      body.push([{text: v.description, style: 'tableHeader', rowSpan: inbound.length},
               {text: v.group_id, style: 'tableHeader', rowSpan: inbound.length},
               inbound[0].user_id_group_pairs,
               eval_protocol(inbound[0].ip_protocol),
               eval_port(inbound[0].from_port, inbound[0].to_port),
               inbound[0].ip_ranges[0].cidr_ip,
               outbound[0].user_id_group_pairs,
               eval_protocol(outbound[0].ip_protocol),
               eval_port(outbound[0].from_port, outbound[0].from_port),
               outbound[0].ip_ranges[0].cidr_ip
      ]);

      inbound.shift(); // Remove first index
      outbound.shift();  // Remove first index

      if(inbound.length > outbound.length){
        inbound.forEach(function(v,index){
            if(outbound.length > index){
              body.push(['','',
                    v.user_id_group_pairs,
                    eval_protocol(v.ip_protocol),
                    eval_port(v.from_port, v.to_port),
                    v.ip_ranges[0].cidr_ip,
                    outbound[index].user_id_group_pairs,
                    eval_protocol(outbound[index].ip_protocol),
                    eval_port(outbound[index].from_port, outbound[index].to_port),
                    outbound[index].ip_ranges[0].cidr_ip
                  ]);
            }else{
              body.push(['','',
                    v.user_id_group_pairs,
                    eval_protocol(v.ip_protocol),
                    eval_port(v.from_port, v.tp_port),
                    v.ip_ranges[0].cidr_ip,
                    '',
                    '',
                    '',
                    ''
                  ]);
            }

        });
      }else{
        outbound.forEach(function(v,index){
            if(inboound.length > index){
              body.push(['','',
                    v.user_id_group_pairs,
                    eval_protocol(v.ip_protocol),
                    eval_port(v.from_port.toString()),
                    v.ip_ranges[0].cidr_ip,
                    inboound[index].user_id_group_pairs,
                    eval_protocol(inboound[index].ip_protocol),
                    eval_port(inboound[index].from_port,inboound[index].to_port),
                    inboound[index].ip_ranges[0].cidr_ip
                  ]);
            }else{
              body.push(['','',
                    v.user_id_group_pairs,
                    eval_protocol(v.ip_protocol),
                    eval_port(v.from_port,v.to_port),
                    v.ip_ranges[0].cidr_ip,
                    '',
                    '',
                    '',
                    ''
                  ]);
            }

        });
      }
  }
  );
  console.log(body);
  return body;
}
