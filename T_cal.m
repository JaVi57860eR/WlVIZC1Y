function [T_final] = T_cal(numOfVi,alpha_i,beita_i)

Vi(1:numOfVi) = [1:1:numOfVi];
Vj(1:numOfVj) = [1:1:numOfVj];

%% 配置实验中的车辆相关参数
%……

for Vi = 1 : 1 : numOfVi
    % 任务型车辆的初始位置，初始化后固定，代入后续计算中
    l_i_0(Vi) = rand .* 600 ; 
    % 任务型车辆速度-30或30km/h，初始化后固定，代入后续计算中
    v_i(Vi) = round(rand) .* 60 -30;
    % 初始化标志位为0
    flag_i(Vi) = 0;
    
end

for Vj = 1 : 1 : numOfVj
    % 初始化候选服务型车辆集合
    capital_gama(Vi,Vj) = 0; 
    % 初始化服务型车辆位置
    l_j_0(Vj) = rand .* 600 ;
    % 服务型车辆速度[-30，30]km/h，初始化后固定，代入后续计算中
    v_j(Vj) = rand .* 60 -30;
end

% 选择合适临近车辆算法，计算候选服务型车辆集合
for Vi = 1 : 1 : numOfVi
    for Vj = 1 : 1 : numOfVj
        if (abs( l_j_0(Vj) - l_i_0(Vi) ) <= 200)
        capital_gama(Vi,Vj) = 1;
        end
    end
end

for Vi = 1 : 1 : numOfVi
     
    %配置实验中的计算相关参数
    %……    

    % 计算RSU传输时延
    t_trans_RSU(Vi) = beita_i(Vi) .* D_i(Vi) ./ R_i_AVR;
    % 计算RSU执行时延
    t_cal_RSU(Vi) = beita_i(Vi) .* C_i(Vi) ./ f_i_RSU;
    
    if ( Vi >= 2 )
        t_wait_RSU(Vi) =  t_trans_RSU(Vi - 1) + t_cal_RSU(Vi - 1) - t_trans_RSU(Vi); 
        if ( t_wait_RSU(Vi) > 0)
            flag_i(Vi) = 1;
        end
    end

    if ( flag_i(Vi) == 0 )
    % 计算RSU等待时延
    t_wait_RSU(Vi) = 0;
    end
    
    % 计算RSU的计算时延
    T_RSU_V2I(Vi) = t_trans_RSU(Vi) + t_cal_RSU(Vi) + t_wait_RSU(Vi);
    
    % 从分配决策变量比例算法中获取变量γi
    gama_i(Vi) = 1 - alpha_i(Vi) - beita_i(Vi);
    if (gama_i(Vi) <= 0)
        gama_i(Vi) = 0;
    end
end

% V2V计算资源最小化
f_i_j = 1 .* 10 ^ 8 ;

% V2V计算时延
for Vi = 1 : 1 : numOfVi
    for Vj = 1 : 1 : numOfVj
        if (capital_gama(Vi,Vj) == 1)
            t_i_j_trans(Vi , Vj) = gama_i(Vi) .* D_i(Vi) ./ R_i_j_AVR;
            t_i_j_cal(Vi, Vj) = gama_i(Vi) .* C_i(Vi) ./ f_i_j;
        else
            t_i_j_trans(Vi , Vj) = gama_i(Vi) .* 10000;
            t_i_j_cal(Vi, Vj) = gama_i(Vi) .* 10000;
        end
        T_i_j_V2V(Vi, Vj) = t_i_j_trans(Vi , Vj) + t_i_j_cal(Vi, Vj);
    end
    T_i_j_V2V_final = min(T_i_j_V2V,[],2);
end
T_i_j_V2V_final = T_i_j_V2V_final.';

for Vi = 1 : 1 : numOfVi
    %本地计算时延
    t_i_loc(Vi) = alpha_i(Vi) .* C_i(Vi) ./ f_i_l(Vi);
    T(Vi) = t_i_loc(Vi) + T_RSU_V2I(Vi) + T_i_j_V2V_final(Vi);
end
T_final = sum(T);
end