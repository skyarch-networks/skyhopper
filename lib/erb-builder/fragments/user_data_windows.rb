#User data for windows r12 powershell
{ "Fn::Base64": { "Fn::Join": ["", [
        "<powershell>\n",
        "$cert = New-SelfSignedCertificate -CertStoreLocation Cert:\\LocalMachine\\My -DnsName hostname \n",
        "winrm delete winrm/config/Listener?Address=*+Transport=HTTPS \n",
        "New-Item -Address * -Force -Path wsman:\\localhost\\listener -Port 5986 -HostName ($cert.subject -split '=')[1] -Transport https -CertificateThumbPrint $cert.Thumbprint  \n",
        "Set-Item WSMan:\\localhost\\Shell\\MaxMemoryPerShellMB 1024 \n",
        "Set-Item WSMan:\\localhost\\MaxTimeoutms 1800000 \n",
        "netsh advfirewall firewall add rule name='WinRM-HTTPS' dir=in localport=5986 protocol=TCP action=allow \n",
        "</powershell>",
]]}}
