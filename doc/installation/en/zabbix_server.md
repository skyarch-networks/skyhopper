How to deploy the ZABBIX Server
============================

SkyHopper with Zabbix for monitoring infrastructures.
Therefore, After you deploy SkyHopper, you must first deploy the Zabbix Server.


1 Sign up
-----------------

Since the user has not yet exists after deployment, It will require you to sign up to SkyHopper.

Access skyhopper and go to sign up page after deployment. Then enter user name and email, make sure you select the Admin and Master checkbox before pressing create.


2 Select a Zabbix Server Infrastructure
--------------------------------------------

Zabbix Server is managed as an infrastructure on SkyHopper.
First of all, select the infrastructure.

1. Click the SkyHopper client
2. Click Zabbix Server Project
3. Click show button for more details


3 Sign up to Chef Server
------------------------

In order to install Zabbix using Chef, Please register first the EC2 instance to Chef Server

Click bootstrap with chef server botton


4 Select Runlist
------------------

Press the Edit Runlist button. So that Runlist editing screen will appear.
In this screen, you can choose whether to perform a Chef by selecting any of the recipes.
Since we only need to install the Zabbix Server, please double click `zabbix_server` to add to the runlist.
To save changes, press the save changes button.


5 Cook
------------

Run chef by click cook button.
Cook status is displayed in real time.

When the cook status has been successfully done, Zabbix Server Deployment is also done.
Finally, SkyHopper will populate the user information for Zabbix Server.

6 Setting up user information
-------------------------

Choose Zabbix Server from the top left of the screen settings.
Enter your username and password.
The default value is admin and  ilikerandompasswords.

Finally, we will do the synchronization of users and Zabbix user information on SkyHopper.

please go to the user management page. by clicking on the top right of the page with the user name,  
If you press the `Synchronize with Zabbix Server` button of the page, the user will be synchronized .


Congratulations! Zabbix Server configuration is complete.
