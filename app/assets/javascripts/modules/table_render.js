//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

// Data is the Rules summary of the assigned security group for the instance_type

// Which contains inbound and outbound rules of the said security group
// The main contents are: description, group ID, inbound and outbound rules
/* Data eg.:
  data = {
    description: "fugafuga",
    group_id: "sg-4b30d72f",
    group_name: "hogehoge",
    ip_permissions: Array,
    ip_permissions_egress: Array
    vpc_id: "not used"
  }

*/
module.exports = function(data){
  return {
    style: 'tableExample',
    color: '#444',
    table: {
        headerRows: 2,
        dontBreakRows: true,
        widths: [ 120, 90, 'auto', 'auto', 'auto', 100,  'auto', 'auto', 'auto', 100],
        body: buildTableBody(data)
    },
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

    console.log(data);
    body.push([{ rowSpan: 2, text: t('security_groups.description'),  style: 'tableHeader' },
            { rowSpan: 2, text: t('security_groups.group_id'),style: 'tableHeader' },
            { colSpan: 4, text: t('security_groups.inbound'), style: 'tableHeader' },
            'x','x','xx',
            { colSpan: 4, text:  t('security_groups.outbound'), style: 'tableHeader' },
            'x', 'x', 'x',], ['x' , 'x',
          {text: t('security_groups.type'), style: 'tableHeader' },
          {text: t('security_groups.protocol'), style: 'tableHeader' },
          {text: t('security_groups.port_range'),  style: 'tableHeader' },
          {text: t('security_groups.source'),  style: 'tableHeader' },
          {text: t('security_groups.type'),  style: 'tableHeader' },
          {text: t('security_groups.protocol'), style: 'tableHeader' },
          {text: t('security_groups.port_range'), style: 'tableHeader' },
          {text: t('security_groups.source'),  style: 'tableHeader' },
      ]);

    data.forEach(function(v,index) {
      var inbound =  v.ip_permissions;
      var outbound = v.ip_permissions_egress;

      push_initial(v,inbound, outbound, body);
      inbound.shift(); // Remove first index
      outbound.shift();  // Remove first index
      extract_next(inbound, outbound, body);

  });
  return body;
}

function push_initial(v, inbound, outbound, body){
  //Check if inbound lenght is greater than outbound lenght
  if(inbound.length > outbound.length){
    // If outbound has contents
    if(outbound.length > 0){
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
      // Insert (-) if outbound doesn't exists
    }else{
        body.push([{text: v.description, style: 'tableHeader', rowSpan: inbound.length},
                 {text: v.group_id, style: 'tableHeader', rowSpan: inbound.length},
                 inbound[0].user_id_group_pairs,
                 eval_protocol(inbound[0].ip_protocol),
                 eval_port(inbound[0].from_port, inbound[0].to_port),
                 inbound[0].ip_ranges[0].cidr_ip,
                 '-',  '-',   '-', '-'
        ]);
      }
      // IF outbound length is greated than inbound
    }else if (inbound.length < outbound.length) {
      // Check if inbound has contents
      if(inbound.length > 0){
        body.push([{text: v.description, style: 'tableHeader', rowSpan: outbound.length},
                 {text: v.group_id, style: 'tableHeader', rowSpan: outbound.length},
                 inbound[0].user_id_group_pairs,
                 eval_protocol(inbound[0].ip_protocol),
                 eval_port(inbound[0].from_port, inbound[0].to_port),
                 inbound[0].ip_ranges[0].cidr_ip,
                 outbound[0].user_id_group_pairs,
                 eval_protocol(outbound[0].ip_protocol),
                 eval_port(outbound[0].from_port, outbound[0].from_port),
                 outbound[0].ip_ranges[0].cidr_ip
        ]);
      }else {
        body.push([{text: v.description, style: 'tableHeader', rowSpan: outbound.length},
                 {text: v.group_id, style: 'tableHeader', rowSpan: outbound.length},
                 '-', '-', '-', '-',
                 outbound[0].user_id_group_pairs,
                 eval_protocol(outbound[0].ip_protocol),
                 eval_port(outbound[0].from_port, outbound[0].from_port),
                 outbound[0].ip_ranges[0].cidr_ip
        ]);
      }
      //Push blank
    }else {
      body.push([{text: v.description, style: 'tableHeader', rowSpan: outbound.length},
               {text: v.group_id, style: 'tableHeader', rowSpan: outbound.length},
               '-', '-', '-', '-','-','-','-','-'
      ]);
    }
}



function extract_next(inbound, outbound, body){
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
                '-',
                '-',
                '-',
                '-'
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
                '-',
                '-',
                '-',
                '-'
              ]);
        }

    });
  }

}
