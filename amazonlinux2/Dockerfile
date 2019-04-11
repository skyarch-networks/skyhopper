FROM amazonlinux:2

RUN yum update -y && yum clean all

# Ruby
RUN yum groupinstall -y 'Development tools' 'Development Libraries' ; amazon-linux-extras install ruby2.4 && \
  yum install -y ruby-devel sqlite-devel zlib-devel readline-devel openssl-devel libxml2-devel libxslt-devel mysql-devel openssl && \
  yum clean all
RUN gem install --no-document bundler -v 1.17.3

# Nodejs amd Yarn
RUN curl -sL https://rpm.nodesource.com/setup_10.x | bash - && \
  yum install -y nodejs  && \
  yum clean all
RUN curl -o- -L https://yarnpkg.com/install.sh | bash && \
  echo 'export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"' >> ~/.bashrc

# Ansible
RUN amazon-linux-extras install ansible2 && \
  yum clean all && \
  sed -i -e 's/^#retry_files_enabled = False$/retry_files_enabled = False/' /etc/ansible/ansible.cfg

RUN mkdir ~/.ssh && chmod 700 ~/.ssh

WORKDIR /prj/skyhopper
CMD ["scripts/app_run.sh"]
